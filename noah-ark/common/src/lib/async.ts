export function SemaphoreAsync(maxConcurrent: number): MethodDecorator {
    const promiseQueue: (() => Promise<any>)[] = [];
    let runningCount = 0;

    const execute = async () => {
        if (runningCount < maxConcurrent && promiseQueue.length > 0) {
            runningCount++;
            const nextPromiseFn = promiseQueue.shift()!;
            try {
                await nextPromiseFn();
            } finally {
                runningCount--;
                execute(); // Process the next item in the queue
            }
        }
    };

    return function (target: any, propertyName: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: any, ...args: any[]) {
            return new Promise((resolve, reject) => {
                promiseQueue.push(async () => {
                    try {
                        const result = await originalMethod.apply(this, args);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
                execute();
            });
        };

        return descriptor;
    };
}

export function MutexAsync(): MethodDecorator {
    const promiseCache = new WeakMap<object, Promise<any> | null>();

    return function (target: any, propertyName: string | symbol, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (this: any, ...args: any[]) {
            if (promiseCache.get(this)) {
                return promiseCache.get(this);
            }

            const promise = originalMethod.apply(this, args).finally(() => {
                promiseCache.set(this, null);
            });

            promiseCache.set(this, promise);
            return promise;
        };

        return descriptor;
    };
}
