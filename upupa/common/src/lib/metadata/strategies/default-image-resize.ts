export function getResizedImageLink(path: string, w?: number, h?: number): string {
    const [base, qps] = path.split("?");
    const queryParams = (qps ?? "")
        .split("&")
        .map((q) => q.split("="));
    const imageResizeOptions = new Map<string, string>([
        ["view", "1"],
        ["attachment", "inline"],
    ]);

    if (w) imageResizeOptions.set("w", w + "");
    if (h) imageResizeOptions.set("h", h + "");

    for (const q of queryParams) {
        if (q[0] === "attachment") continue;
        imageResizeOptions.set(q[0], q[1]);
    }
    const qStr =
        "?" +
        Array.from(imageResizeOptions.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join("&");

    return base + qStr;
}
