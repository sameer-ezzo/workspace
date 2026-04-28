import { AuthTokenAccessor } from '@upupa/auth';
import { UploadClient, UploadService, UploadStream } from '@upupa/upload';

export class HtmlUploadAdapter {
    TOKEN_COOKIE_NAME = 'ckCsrfToken';
    TOKEN_LENGTH = 40;

    xhr: XMLHttpRequest;
    tokenCharset = 'abcdefghijklmnopqrstuvwxyz0123456789';

    constructor(
        private readonly loader: any,
        private readonly url: string,
        private readonly client: UploadClient,
        private readonly authToken: AuthTokenAccessor,
    ) {}

    task: UploadStream;
    abort = () => this.task?.cancel();
    async upload() {
        const file = await this.loader.file;

        return new Promise((resolve, reject) => {
            this.task = this.client.upload(this.url, file, file.name);
            const genericError = `Cannot upload file: ${file.name}.`;

            this.task.progress$.subscribe((p) => (this.loader.uploadTotal = p));
            this.task.response$.subscribe({
                next: (fileInfo) => {
                    this.loader.uploaded = true;
                    const token = this.authToken.getToken();
                    const qps = token ? `?access_token=${token}` : '';
                    resolve({
                        default: `${this.client.baseOrigin}${fileInfo.path}${qps}`,
                    });
                },
                error: (err) => reject(genericError + ' ' + err?.message),
            });
        });
    }
}
