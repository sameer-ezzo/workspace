/**
 * Robustly normalizes any error value into a ParsedApiError shape.
 * Handles string, Error, HttpErrorResponse, and malformed JSON cases.
 */
export function normalizeApiError(error: any): ParsedApiError {
    // If already parsed, return as is
    if (error && typeof error === 'object' && (error.code || error.message)) {
        return error as ParsedApiError;
    }
    // If Angular HttpErrorResponse
    if (error && error.error && (error.error.code || error.error.message)) {
        return parseApiError(error.error);
    }
    // If string, try to parse as JSON, else treat as message
    if (typeof error === 'string') {
        try {
            const parsed = JSON.parse(error);
            return parseApiError(parsed);
        } catch {
            return { code: undefined, message: error, raw: error };
        }
    }
    // If Error instance
    if (error instanceof Error) {
        return { code: undefined, message: error.message, raw: error };
    }
    // Fallback: treat as unknown object
    return { code: undefined, message: 'Unknown error', raw: error };
}
export type ParsedApiError = {
    code?: string;
    message?: string;
    statusCode?: number;
    raw: any;
};

function normalizeCode(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return normalized || undefined;
}

export function parseApiError(error: any): ParsedApiError {
    const source = error?.error ?? error?.body ?? error ?? {};

    const rawCode = source?.code ?? error?.code ?? source?.msg ?? error?.msg ?? source?.message ?? error?.message;
    const code = normalizeCode(rawCode);
    const message = source?.message ?? error?.message ?? (typeof rawCode === "string" ? rawCode : "ERROR");
    const statusCode = Number(source?.statusCode ?? error?.statusCode ?? error?.status ?? source?.status) || undefined;

    return {
        code,
        message,
        statusCode,
        raw: source,
    };
}
