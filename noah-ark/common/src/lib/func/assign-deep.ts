export function deepAssign(target: any, source: any): any {
    for (const key in source) {
        if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
            deepAssign(target[key] as any, source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}
