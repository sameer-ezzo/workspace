
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpRequest, HttpEventType, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { FileInfo, UploadStream } from './model';


@Injectable({ providedIn: 'root' })
export class UploadService {


    constructor(public http: HttpClient) { }

    upload(url: string, file: File, fileName: string, formData?: Record<string, string>): UploadStream {

        const task = new UploadStream();

        const form = new FormData();
        if (formData) { Object.keys(formData).forEach(k => form.append(k, formData[k])); }
        form.append(fileName, file);


        const req = new HttpRequest('POST', url, form, { reportProgress: true });
        task.connection = this.http.request(req).subscribe({
            next: (event: any) => {
                if (event.type === HttpEventType.UploadProgress) {
                    const progress = Math.round(event.loaded / event.total * 100);
                    task.progress$.next(progress);
                } else if (event instanceof HttpResponse) {

                    task.progress$.complete();
                    const body = event.body.streams ? event.body.streams : event.body[0];
                    task.response$.next(body); //todo maybe upload is complex and multiple streams got sent in the same response
                    task.response$.complete();
                }
            },
            error: (err: HttpErrorResponse) => {
                if (err.error instanceof Error) {
                    // A client-side or network error occurred. Handle it accordingly.
                    task.response$.error(err.error);
                    task.progress$.error(err.error);
                } else {
                    // The backend returned an unsuccessful response code.
                    task.response$.error(err);
                    task.progress$.error(err);
                }
            }
        });

        return task;
    }

    delete(url: string) {
        return firstValueFrom(this.http.delete(url, { responseType: 'text' }));
    }

    uploadContent(url: string, files: { content: string, fieldname?: string, filename: string }[], formData?: Partial<FileInfo>): UploadStream {
        const stream = new UploadStream();
        firstValueFrom(this.http.post<FileInfo[]>(url, { ...formData, files }))
            .then(res => {
                stream.progress$.next(100);
                stream.progress$.complete();
                stream.response$.next(res[0]);
                stream.response$.complete();
            })
            .catch(err => {
                stream.progress$.error(err);
                stream.response$.error(err);
            });
        return stream;
    }

    uploadAsync(arg0: string, file: File, filename: string, formData: any) {
        const rx = this.upload(arg0, file, filename, formData);
        return firstValueFrom(rx.response$);
    }
    uploadContentAsync(arg0: string, files: { content: string; fieldname?: string; filename: string; }[], formData: any) {
        const rx = this.uploadContent(arg0, files, formData);
        return firstValueFrom(rx.response$);
    }

    openFileDialog(accept: string = null, multiple = false) {
        return openFileDialog(accept, multiple)
    }

}


export function openFileDialog(accept: string = null, multiple = false): Promise<FileList> { //not static because that would break arrow functions are designed
    return new Promise((resolve, reject) => {
        const fileInput = document.createElement('input');
        fileInput.setAttribute('type', 'file');
        fileInput.classList.add('hidden');
        fileInput.style.display = 'none';

        if (accept) { fileInput.setAttribute('accept', accept); }
        if (multiple) { fileInput.setAttribute('multiple', 'true'); }

        fileInput.addEventListener('change', () => {
            fileInput.remove();
            resolve(fileInput.files);

        }, false);

        fileInput.click();
    });
}


