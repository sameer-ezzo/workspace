export function deepAssign(target: any, source: any, ...sources: any[]): any {
    for (const s of [source, ...sources]) {
        for (const key in s) {
            if (s[key] instanceof Object && key in target && target[key] instanceof Object) {
                deepAssign(target[key] as any, s[key]);
            } else {
                target[key] = s[key];
            }
        }
    }
    return target;
}
