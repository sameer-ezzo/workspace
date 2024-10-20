import { AuthService } from '@upupa/auth';
import { UploadService, UploadStream } from '@upupa/upload';

export class HtmlUploadAdapter {
    TOKEN_COOKIE_NAME = 'ckCsrfToken';
    TOKEN_LENGTH = 40;

    loader: any;
    private _url: string;
    public get url(): string {
        return this._url;
    }
    public set url(value: string) {
        this._url =
            value
                .split('/')
                .filter((x) => x)
                .join('/') + '/';
    }
    xhr: XMLHttpRequest;
    tokenCharset = 'abcdefghijklmnopqrstuvwxyz0123456789';
    private _uploader: UploadService;
    public get uploader(): UploadService {
        return this._uploader;
    }
    public set uploader(value: UploadService) {
        this._uploader = value;
    }
    private _auth: AuthService;
    public get auth(): AuthService {
        return this._auth;
    }
    public set auth(value: AuthService) {
        this._auth = value;
    }

    constructor(loader: any) {
        this.loader = loader;
    }

    task: UploadStream;
    abort = () => this.task?.cancel();
    async upload() {
        const file = await this.loader.file;

        return new Promise((resolve, reject) => {
            this.task = this.uploader.upload(this.url, file, file.fieldname);
            const genericError = `Cannot upload file: ${file.name}.`;

            this.task.progress$.subscribe((p) => (this.loader.uploadTotal = p));
            this.task.response$.subscribe({
                next: (fileInfo) => {
                    this.loader.uploaded = true;
                    resolve({
                        default: `/${
                            fileInfo.path
                        }?access_token=${this.auth.get_token()}`,
                    });
                },
                error: (err) => reject(err?.message ?? genericError),
            });
        });
    }
}
