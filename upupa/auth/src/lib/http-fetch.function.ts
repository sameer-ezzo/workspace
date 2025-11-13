export interface HttpFetchError {
    status: number;
    message: string;
    body?: any;
    response?: Response;
}

export async function httpFetch(url, body?: any, timeout = 30000) {
    let response: Response | Record<string, any>;
    let fetcher: Promise<Response>;
    const options: any = {};
    let controller: AbortController = null;

    if (timeout > 0) {
        controller = new AbortController();
        options["signal"] = controller.signal;
    }

    if (body === null) {
        fetcher = fetch(url, options);
    } else {
        const t = typeof body;
        const headers: any = {};
        let payload = null;

        if (t === "string" || t === "number") {
            payload = body + "";
        } else {
            payload = JSON.stringify(body);
            headers["Content-Type"] = "application/json";
        }

        fetcher = fetch(url, { method: "POST", credentials: "include", body: payload, headers, ...options });
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
            controller?.abort();
            reject(new Error("TIMEOUT"));
        }, timeout);
    });

    try {
        // Race the fetcher and timeout promises
        const f = timeout > 0 ? Promise.race([fetcher, timeoutPromise]) : fetcher;
        response = await f;

        if (!(response instanceof Response)) throw new Error("Unexpected response type");
        const contentType = response.headers.get("content-type") || "";
        let responseBody: any;

        try {
            if (contentType.startsWith("application/json")) {
                responseBody = await response.json();
            } else {
                responseBody = await response.text();
            }
        } catch (parseError) {
            // Failed to parse response body
            responseBody = null;
        }

        if (response.status >= 200 && response.status < 300) {
            return responseBody;
        } else {
            // HTTP error response
            const error: HttpFetchError = {
                status: response.status,
                message: responseBody?.message || responseBody?.error || `HTTP ${response.status}: ${response.statusText}`,
                body: responseBody,
                response,
            };
            throw error;
        }
    } catch (e) {
        // Handle different error types
        if (e && typeof e === "object" && "status" in e) {
            // Already a formatted HttpFetchError
            throw e;
        }

        // Handle abort/timeout
        if (e instanceof Error && e.name === "AbortError") {
            const error: HttpFetchError = {
                status: 0,
                message: "REQUEST_TIMEOUT",
            };
            throw error;
        }

        if (e instanceof Error && e.message === "TIMEOUT") {
            const error: HttpFetchError = {
                status: 0,
                message: "REQUEST_TIMEOUT",
            };
            throw error;
        }

        // Handle network errors
        if (e instanceof Error && e.message === "Failed to fetch") {
            const error: HttpFetchError = {
                status: 0,
                message: "NETWORK_ERROR",
            };
            throw error;
        }

        // Handle unknown errors
        const error: HttpFetchError = {
            status: 0,
            message: e instanceof Error ? e.message : "UNKNOWN_ERROR",
            body: e,
        };
        throw error;
    }
}
