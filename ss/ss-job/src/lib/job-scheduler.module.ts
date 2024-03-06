import { Provider, DynamicModule, Module } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { CommonModule, RedisClient } from "@ss/common";
import { JobProcessor, JobScheduler } from "./job-scheduler";
import { JobSchedulerConfig, JOB_SCHEDULAR_CONFIG } from "./job-scheduler.config";

const defaultConfig = new JobSchedulerConfig();


@Module({
    imports: [CommonModule],
    providers: [{
        provide: JOB_SCHEDULAR_CONFIG,
        useValue: new JobSchedulerConfig()
    }, {
        provide: JobScheduler,
        useFactory: (config: JobSchedulerConfig, redis: RedisClient, module: ModuleRef) => new JobScheduler(config, redis, module),
        inject: [JOB_SCHEDULAR_CONFIG, defaultConfig.redis, ModuleRef]
    }],
    exports: [JobScheduler]
})
export class JobSchedulerModule {
    static register<T extends JobProcessor>(
        config: JobSchedulerConfig = defaultConfig,
        processors: Record<string, Provider<T>[]> = {} //Those can be registered later using scheduler.addProcessor method
    ): DynamicModule {
        const _config = { ...defaultConfig, ...config }
        const keys = Object.values(processors ?? {})
        const _processors = keys.length ? keys.reduce((a, b) => a.concat(b)) : [];
        const _jobs = Object.keys(processors).map(key => {
            return {
                provide: key,
                useFactory: (...x) => x,
                inject: processors[key].map(p => 'provide' in p ? p.provide : p)
            } as Provider
        })
        return {
            module: JobSchedulerModule,
            providers: [
                { provide: JOB_SCHEDULAR_CONFIG, useValue: _config },
                {
                    provide: JobScheduler,
                    useFactory: (redis: RedisClient, module: ModuleRef) => new JobScheduler(_config, redis, module),
                    inject: [_config.redis, ModuleRef]
                },
                ..._processors,
                ..._jobs
            ],
            exports: [JobScheduler, ..._processors]
        }

    }
}