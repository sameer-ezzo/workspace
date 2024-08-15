import { Inject, Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { firstValueFrom, from, lastValueFrom, Observable } from 'rxjs'
import { tap, timeout } from 'rxjs/operators'
import { appName, RedisClient } from '@ss/common'
import { logger } from "./logger";
import { JobSchedulerConfig, JOB_SCHEDULAR_CONFIG } from './job-scheduler.config'
import { Job, JobOptions } from 'bull'
import Queue from 'bull'
import { purgeQueue } from './job-purger'

export namespace JobSchedulerExceptions {
    export const NO_PROCESSORS_DEFINED = "NO_PROCESSORS_DEFINED"
    export const NO_PROCESSORS_AVAILABLE = "NO_PROCESSORS_AVAILABLE"
}


export type JobPriority = number | false

export type JobProcessor<TData = any, TResult = any> = {
    readonly name: string;
    canProcess(payload: TData, job?: Job): JobPriority | Promise<JobPriority>; //return false to indicate that payload cannot be processed
    process(payload: TData, job?: Job): Observable<TResult> | Promise<TResult> | TResult;
}

const JobSchedulerQueue = "_main_";
function getJobName(job: Job): string { return (job.opts as any).name ?? job.name; }

@Injectable()
export class JobScheduler {
    public readonly queues: Record<string, Queue.Queue<any>> = {}
    queue: Queue.Queue<any>;
    _cleanUpQueue: Queue.Queue<any>;
    private mainQueueName = ''
    constructor(@Inject(JOB_SCHEDULAR_CONFIG) public readonly schedulerConfig: JobSchedulerConfig,
        private readonly redis: RedisClient,
        private moduleRef: ModuleRef) {
        this.mainQueueName = JobSchedulerQueue + appName
        this.queue = this.createQueue(this.mainQueueName)

        this._initCleanUpQueue()
    }

    private async _initCleanUpQueue() {
        if (!this._cleanUpQueue) {

            //start a repeating job to clean up queues(stuck jobs, completed jobs, etc ...)
            const cleanUpQueueName = `${this.mainQueueName}_cleanup`
            this._cleanUpQueue = this.createQueue(cleanUpQueueName,
                async () => {
                    for (const q in this.queues) {
                        await purgeQueue(this.queues[q])
                    }
                })

            //add repeatable every 12 hours
            this._cleanUpQueue.add({}, { repeat: { cron: '0 */12 * * *' } })
        }
    }

    createQueue(queueName: string, processCallback = (job: Job<any>) => this.process(job)): Queue.Queue<any> {

        const queue = new Queue(queueName, { redis: this.redis.options, settings: this.schedulerConfig.settings ?? {} })
        logger.info(`Creating queue ${queueName} on redis://${this.redis.options.host}:${this.redis.options.port}`)
        //this.queue = new Q
        queue.on(`[QUEUE ${queueName}] ACTIVE`, job => this.onQueueActive(job))
        queue.on(`[COMPLETED ${queueName}]`, (job, result) => this.onQueueCompleted(job, result))
        queue.on(`[FAILED ${queueName}]`, (job, err) => this.onQueueFailed(job, err))

        queue.process(processCallback)

        this.queues[queueName] = queue

        firstValueFrom(from(queue.client.ping()).pipe(timeout(1000))).catch(() => {
            logger.error(`Queue ${queueName} could not be connected to redis`)
        })

        return queue
    }

    async run<T = any>(jobName: string, payload: any, jobOptions?: Exclude<JobOptions, { name:string }> & { queueName?: string }): Promise<Job<T>> {

        const processors = await this.resolveProcessors(jobName)
        if (Array.isArray(processors) && processors.length > 0) {
            const queue = this.queues[jobOptions?.queueName ?? this.mainQueueName]
            const job = (await queue.add({ payload: payload }, { timeout: 10000, attempts: processors.length, backoff: 200, ...jobOptions, name: jobName } as JobOptions)) as Job<T>;
            //TODO job can be processed immediatly in case redis is not required
            return job
        }
        else throw `Job ${jobName} has no processors registered`
    }

    private readonly _processors: Record<string, JobProcessor[]> = {}

    addProcessors(jobName: string, ...processors: JobProcessor[]) {
        this._processors[jobName] ??= []
        this._processors[jobName].push(...processors)
    }

    async resolveProcessors(name: string) {
        const processors = [] as JobProcessor[]
        const resolvedFromService = this._processors[name] ?? []
        processors.push(...resolvedFromService)
        try {
            const reolvedFromModule = await firstValueFrom(
                from(this.moduleRef.resolve<string, JobProcessor[]>(name)
                ).pipe(timeout(500)));
            processors.push(...reolvedFromModule)
        } catch (error) {
            // logger.info(error)
        }



        return processors;
    }


    onQueueActive(job: Job): void { logger.info(`Processing job ${getJobName(job)} # ${job.id}`) }
    onQueueCompleted(job: Job, result: any): void { logger.info(`Job completed ${getJobName(job)} # ${job.id} with result: "${result}"`) }
    onQueueFailed(job: Job, err: any): void { logger.error(`Job ${getJobName(job)} # ${job.id} has failed with error: "${err}"`) }


    async process(job: Job): Promise<any> {
        const name = getJobName(job);

        //get processors and save the rest to job data
        let processors = await this.resolveProcessors(name)
        if (processors.length === 0) {
            await job.moveToFailed({ message: `${JobSchedulerExceptions.NO_PROCESSORS_DEFINED}:${name}` })
            logger.info(`${JobSchedulerExceptions.NO_PROCESSORS_DEFINED}:${name}`, job);
            throw new Error(`${JobSchedulerExceptions.NO_PROCESSORS_DEFINED}:${name} ${job.id}`)
        }

        //filter out processors which tried already
        if (Array.isArray(job.data._processors) && job.data._processors.length) {
            const current = job.data._processors as string[]

            processors = processors.filter(p => current.indexOf(p.name) > -1)
        }

        //check availability / priority
        let _processors = await Promise.all(processors.map(async p => {
            try {
                const priority = await p.canProcess(job.data.payload, job)
                return priority !== false ? { processor: p, priority } : null
            } catch (error) {
                logger.verbose(`Processor ${p.name} cannot process the job because of: ${error}`)
                return null
            }
        }))
        _processors = _processors.filter(p => p != null)

        if (_processors.length === 0) {
            await job.moveToFailed({ message: JobSchedulerExceptions.NO_PROCESSORS_AVAILABLE })
            throw { name: JobSchedulerExceptions.NO_PROCESSORS_AVAILABLE, message: `No processors left for ${name}` }
        }

        processors = _processors
            .filter(p => p !== null)
            .sort((a, b) => (a?.priority || _processors.length) - (b?.priority || _processors.length))
            .filter(p => p?.processor !== null)
            .map(x => x.processor)

        const processor = processors.shift()
        if (!processor) throw new Error("No processor available")
        await job.update({
            payload: job.data.payload,
            _current: processor.name,
            _processors: processors.map(p => p.name)
        })
        await job.progress(0)


        try {
            //try with current processor
            const rx = from(processor.process(job.data.payload, job))
            const worker = rx.pipe(tap(p => isNaN(+(p ?? '')) ? null : job.progress(p)))
            const result = await lastValueFrom(worker)
            await job.progress(100)
            await job.moveToCompleted(result as string)
            return result
        } catch (error) {
            const _failures = job.data._failures ?? []
            _failures.push({ processor: processor?.name || name, error: error.message ?? error.msg ?? error.toString(), stack: error.stack })
            await job.update({ ...job.data, _failures })
            await job.moveToFailed({ message: error.message ?? error.msg ?? error.toString() })
        }
    }

}





