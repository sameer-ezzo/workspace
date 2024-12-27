export function pad(num: number | string, size: number): string {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

export function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
export function randomId(): string {
    return (S4() + S4() + "-" + S4() + "-" + S4().substring(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}
