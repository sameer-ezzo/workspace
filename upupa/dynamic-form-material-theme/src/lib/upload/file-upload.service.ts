import { DOCUMENT } from "@angular/common";
import { inject, Injectable } from "@angular/core";
import { DataService } from "@upupa/data";

import { openFileDialog, UploadClient, UploadStream } from "@upupa/upload";
export type UploadTask = {
    file?: File;
    content?: string;
    src?: string | ArrayBuffer;
    stream?: UploadStream;
};

@Injectable({providedIn: "root"})
export class FileUploadService {
    readonly uploadClient = inject(UploadClient);
    readonly data = inject(DataService);
    private readonly doc = inject(DOCUMENT);

    async selectFromDevice(path: string, multiple = false, accept?: string): Promise<UploadStream[]> {
        const fileList = await openFileDialog(this.doc, accept, multiple);
        return Array.from(fileList).map((f) => this.upload(path, f));
    }

    async readURL(file: File): Promise<string | ArrayBuffer> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    upload(path: string, file: File): UploadStream {
        return this.uploadClient.upload(path, file, file.name);
    }
}
