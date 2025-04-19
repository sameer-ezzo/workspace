
export async function post(url: string, options: { headers?: any, body?: any | string, form?: any }): Promise<string> {
    if (options.form) {
        const formData = new URLSearchParams();
        for (const key in options.form) {
            formData.append(key, options.form[key]);
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...options.headers,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        if (response.ok) {
            return response.text();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } else {
        let body: any;
        if (typeof options.body === 'string') {
            body = options.body;
        } else {
            body = JSON.stringify(options.body);
            options.headers = {
                ...options.headers,
                'Content-Type': 'application/json',
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: options.headers,
            body,
        });

        if (response.ok) {
            return response.text();
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }
}