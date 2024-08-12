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
}