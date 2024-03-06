
export function delay(timeout: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => { resolve() }, timeout);
    });
}


export async function task<T>(promise: Promise<T>): Promise<{ result: T } | { error: Error }> {
    try {
        const result = await promise
        return { result }
    } catch (error) {
        return { error }
    }
}