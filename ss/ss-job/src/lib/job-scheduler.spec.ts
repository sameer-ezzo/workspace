import { Test, TestingModule } from '@nestjs/testing';
import { interval, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';
import { JobProcessor, JobScheduler } from "./job-scheduler";
import { JobSchedulerModule } from "./job-scheduler.module";
import { JobSchedulerConfig } from './job-scheduler.config';

export class TestJobProcessorWithError implements JobProcessor {
    readonly name = 'TestJobProcessorWithError';
    canProcess(payload: any): number { return 20 }
    process(data: any): Observable<any> { return interval(1000).pipe(first(), map(x => { throw "TestJobProcessorWithError" })) }
}
export class TestJobProcessorThatWorks implements JobProcessor {
    readonly name = 'TestJobProcessorThatWorks';
    canProcess(payload: any): number { return 10; }
    process(data: any): Observable<any> { return interval(1000).pipe(first(), map(x => "TestJobProcessorThatWorks")) }
}



describe('JobScheduler', () => {
    let app: TestingModule;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            imports: [JobSchedulerModule.register(new JobSchedulerConfig())]
        }).compile();
    });

    describe('resolveProcessors', () => {
        it('should return array with length 1', async () => {
            const scheduler = app.get<JobScheduler>(JobScheduler);
            scheduler.addProcessors('test', new TestJobProcessorThatWorks())

            expect((await scheduler.resolveProcessors('test')).length).toEqual(1);
        });
    });

    describe('run', () => {
        it('should return Job', async () => {
            const scheduler = app.get<JobScheduler>(JobScheduler);
            scheduler.addProcessors('test', new TestJobProcessorThatWorks())
            const job = await scheduler.run('test', {});

            expect(isNaN(+job.id)).toBeFalsy()
        });
    });

    describe('job consumer', () => {
        it('single processor - should succeed', async () => {
            const scheduler = app.get<JobScheduler>(JobScheduler);
            scheduler.addProcessors('test', new TestJobProcessorThatWorks())
            const job = await scheduler.run('test', {});


            const result = await scheduler.process(job);
            expect(result).toEqual("TestJobProcessorThatWorks");
        });

        it('single processor - should error', async () => {
            const scheduler = app.get<JobScheduler>(JobScheduler);
            scheduler.addProcessors('test', new TestJobProcessorWithError());

            const job = await scheduler.run('test', {});

            try {
                await scheduler.process(job);
            } catch (error) {
                expect(error).toEqual("TestJobProcessorWithError");
            }
        });

        it('multi processor - should succeed', async () => {
            const scheduler = app.get<JobScheduler>(JobScheduler);
            scheduler.addProcessors('test', new TestJobProcessorThatWorks());
            scheduler.addProcessors('test', new TestJobProcessorWithError());

            const job = await scheduler.run('test', {});


            try {
                await scheduler.process(job);
            } catch (error) {
                expect(error).toEqual("TestJobProcessorWithError");
                expect(job.data._current).toEqual("TestJobProcessorWithError");
                expect(job.data._processors.length).toEqual(1);
            }

            //THIS IS THE RETRY
            const result = await scheduler.process(job);
            expect(result).toEqual("TestJobProcessorThatWorks");
            expect(job.data._current).toEqual("TestJobProcessorThatWorks");
            expect(job.data._processors.length).toEqual(0);

        });


    });
});
