import * as request from 'request';
export function post(url: string, options: { headers?: any, body?: any | string, form?: any }): Promise<string> {

    if (options.form) {
        options.headers = Object.assign({}, options.headers, { 'Content-Type': 'application/x-www-form-urlencoded' });
        return new Promise<string>((resolve, reject) => {
            request.post(url, { headers: options.headers, form: options.form }, (err, res, body) => {
                if (res.statusCode >= 200 && res.statusCode <= 300) resolve(body);
                else reject(err);
            })
        });
    }
    else {
        let body: any;
        if (typeof options.body === 'string') body = options.body
        else {
            body = JSON.stringify(options.body);
            options.headers = Object.assign({}, options.headers, { 'Content-Type': 'application/json' });
        }

        return new Promise<string>((resolve, reject) => {
            request.post(url, { headers: options.headers, body }, (err, res, body) => {
                if (res.statusCode >= 200 && res.statusCode <= 300) resolve(body);
                else reject(err);
            })
        });
    }
}