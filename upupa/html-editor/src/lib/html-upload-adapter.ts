import { AuthService } from "@upupa/auth";
import { UploadService, UploadStream } from "@upupa/upload";

export class HtmlUploadAdapter {
    TOKEN_COOKIE_NAME = 'ckCsrfToken';
    TOKEN_LENGTH = 40;

    loader: any;
    url: string;
    xhr: XMLHttpRequest;
    tokenCharset = 'abcdefghijklmnopqrstuvwxyz0123456789';
    uploader: UploadService
    auth: AuthService;
    constructor(loader: any, url: string, upload: UploadService, auth: AuthService) {
        this.loader = loader
        this.url = url.split('/').filter(x => x).join('/') + '/'
        this.uploader = upload
        this.auth = auth
    }

    task: UploadStream
    abort = () => this.task?.cancel()
    async upload() {
        const file = await this.loader.file


        return new Promise((resolve, reject) => {

            this.task = this.uploader.upload(this.url, file, file.fieldname)
            const genericError = `Cannot upload file: ${file.name}.`;

            this.task.progress$.subscribe(p => this.loader.uploadTotal = p)
            this.task.response$.subscribe({
                next: (fileInfo) => {
                    this.loader.uploaded = true;
                    resolve({
                        default: `/${fileInfo.path}?access_token=${this.auth.get_token()}`
                    })
                },
                error: (err) => reject(err?.message ?? genericError)
            })
        })
    }

    // _initRequest() {
    //     const xhr = this.xhr = new XMLHttpRequest()
    //     xhr.open('POST', this.url, true)
    //     xhr.responseType = 'json'
    // }

    // _initListeners(resolve, reject, file) {
    //     const xhr = this.xhr;
    //     const loader = this.loader;
    //     const genericError = `Cannot upload file: ${file.name}.`;

    //     xhr.addEventListener('error', () => reject(genericError));
    //     xhr.addEventListener('abort', () => reject());
    //     xhr.addEventListener('load', () => {
    //         const response = xhr.response;
    //         if (!response || !response.length) return reject(genericError);

    //         const f = response[0]?.filename;
    //         resolve({ default: `${this.url}/${f.path}`.split('/').map(x => x.trim()).filter(x => x.length > 0).join('/') });
    //     });

    //     if (xhr.upload) {
    //         xhr.upload.addEventListener('progress', evt => {
    //             if (evt.lengthComputable) {
    //                 loader.uploadTotal = evt.total;
    //                 loader.uploaded = evt.loaded;
    //             }
    //         });
    //     }
    // }

    // _sendRequest(file) {
    //     // Prepare form data.
    //     const data = new FormData()
    //     data.append('upload', file)
    //     data.append('ckCsrfToken', this.getCsrfToken())

    //     this.xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`)

    //     // Send request.
    //     this.xhr.send(data)
    // }

    // getCsrfToken() {
    //     let token = this.getCookie(this.TOKEN_COOKIE_NAME);

    //     if (!token || token.length != this.TOKEN_LENGTH) {
    //         token = this.generateToken(this.TOKEN_LENGTH);
    //         this.setCookie(this.TOKEN_COOKIE_NAME, token);
    //     }

    //     return token;
    // }

    // getCookie(name) {
    //     name = name.toLowerCase();
    //     const parts = document.cookie.split(';');

    //     for (const part of parts) {
    //         const pair = part.split('=');
    //         const key = decodeURIComponent(pair[0].trim().toLowerCase());

    //         if (key === name) {
    //             return decodeURIComponent(pair[1]);
    //         }
    //     }

    //     return null;
    // }

    // setCookie(name, value) {
    //     document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';path=/';
    // }

    // generateToken(length) {
    //     let result = '';
    //     const randValues = new Uint8Array(length);

    //     window.crypto.getRandomValues(randValues);

    //     for (let j = 0; j < randValues.length; j++) {
    //         const character = this.tokenCharset.charAt(randValues[j] % this.tokenCharset.length);
    //         result += Math.random() > 0.5 ? character.toUpperCase() : character;
    //     }

    //     return result;
    // }
}