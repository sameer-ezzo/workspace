//parseInt or fallback to default
export function tryParseInt(s: string, fallback: number): number {
    if (s) {
        const result = parseInt(s)
        return isNaN(result) ? fallback : result
    }
    return fallback
}

export function tryParseFloat(s: string, fallback: number): number {
    if (s) {
        const result = parseFloat(s)
        return isNaN(result) ? fallback : result
    }
    return fallback
}