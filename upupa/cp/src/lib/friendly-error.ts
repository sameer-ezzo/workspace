import { HttpErrorResponse } from "@angular/common/http";
import { parseApiError } from "@upupa/common";

export type FriendlyError<E extends Record<string, unknown> = any> = { error: E; code?: string; message: string; status: string };
export function friendlyError<E extends Record<string, unknown> = any>(err: E): FriendlyError<E> {
    const parsed = parseApiError(err);

    if (err instanceof HttpErrorResponse) {
        if (err.status === 0) return { error: err.error, code: parsed.code, message: "Could not connect to server", status: "Connection Problem" };
        if (err.status === 404) return { error: err.error, code: parsed.code, message: parsed.code ?? "The page you are looking for is not found", status: "Not Found" };
        if (err.status === 403) return { error: err.error, code: parsed.code, message: parsed.code ?? "Do you have the required permission?", status: "Access Forbidden" };
        if (err.status === 401) return { error: err.error, code: parsed.code, message: parsed.code ?? "Are you logged in?", status: "Unauthorized" };
        if (err.status === 400) return { error: err.error, code: parsed.code, message: parsed.code ?? parsed.message ?? err.error?.message, status: err.statusText };
        const status = err.status + "";
        if (status.startsWith("5")) return { error: err.error, code: parsed.code, message: parsed.code ?? "Please report this!", status: "Server Error" };
    }

    if ("name" in err) {
        if (err["name"] == "TimeoutError") return { error: err, message: "The server is taking too long to respond", status: "Timeout" };
    }

    return { error: err, code: parsed.code, message: parsed.code ?? parsed.message ?? "An error occurred", status: "Unknown" };
}
