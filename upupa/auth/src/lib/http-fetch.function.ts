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
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            controller?.abort();
            reject("TIMEOUT");
        }, timeout);
    });

    try {
        // Race the fetcher and timeout promises
        const f = timeout > 0 ? Promise.race([fetcher, timeoutPromise]) : fetcher;
        response = await f;

        if (!(response instanceof Response)) throw new Error("Unexpected response type");
        const contentType = response.headers.get("content-type") || "";
        let responseBody: any;

        if (contentType.startsWith("application/json")) {
            responseBody = await response.json();
        } else {
            responseBody = await response.text();
        }

        if (response.status >= 200 && response.status < 300) {
            return responseBody;
        } else {
            throw { status: response.status, body: responseBody, response };
        }
    } catch (e) {
        const error = typeof e === "object" && "message" in e ? e : { message: e };
        if (error["message"] === "Failed to fetch") throw { status: 0, ...error };
        throw e;
    }
}
