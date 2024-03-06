export async function httpFetch(url, body?: any, timeout?: number) {
    let response: Response
    let fetcher: Promise<Response>
    const options = {}
    let controller: AbortController = null
    if (timeout > 0) {
        controller = new AbortController()
        options['signal'] = controller.signal
    }
    if (body === null)
        fetcher = fetch(url, options)
    else {

        const t = typeof body
        const headers = {}
        let payload = null
        if (t === 'string' || t === 'number')
            payload = body + ''
        else {
            payload = JSON.stringify(body)
            headers['Content-Type'] = 'application/json'
        }
        fetcher = fetch(url, { method: 'POST', body: payload, headers, ...options })
    }


    try {
        let resolved = false
        if (timeout > 0) {
            setTimeout(() => {
                if (resolved) return
                controller.abort()
                throw new Error("Timeout")
            }, timeout)
        }
        response = await fetcher
        resolved = true // prevent aborting the request if it's already resolved

        const contentType = response.headers.get('content-type') || ''
        if (contentType.startsWith('application/json')) body = await response.json()
        else body = await response.text()
        if (response.status >= 200 && response.status < 300) return body
        else throw { status: response.status, body, response }
    } catch (e) {
        const error = typeof e == 'object' && 'message' in e ? e : { message: e }
        if (error['message'] === "Failed to fetch") throw { status: 0, ...error }
        throw e
    }
    finally{
        if (controller) {
            controller.abort()
            controller = null
        }

    }
}
