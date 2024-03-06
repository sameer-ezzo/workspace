export function unreachable(name: string, value: never,throws = false): Error {
    const error = new Error(`EXECUTING_UNREACHABLE_CODE ${name}:${value}`);
    if(throws) throw error
    else return error
}
