import { ActionDescriptor } from "@upupa/common";
import { FileInfo, UploadStream } from "@upupa/upload";

type ViewerFileVm = {
    fileName: string;
    file: File | FileInfo;
    uploadTask?: UploadStream;
    error?: any;
};
export class RemoveFileEvent {
    constructor(readonly file: FileInfo) {}
}
export class DownloadFileEvent {
    constructor(readonly file: FileInfo) {}
}
export class UploadFileStartEvent {
    constructor(
        readonly file: File,
        readonly stream: UploadStream,
    ) {}
}
export class UploadFileSuccessEvent {
    constructor(
        readonly fileInfo: FileInfo,
        readonly file: File,
        readonly stream: UploadStream,
    ) {}
}
export class UploadFileEndEvent {
    constructor(readonly fileInfo: FileInfo) {}
}
export class UploadFileErrorEvent {
    constructor(
        readonly file: File,
        readonly error: any,
        readonly message?: string,
    ) {}
}
export class CancelUploadFileEvent {
    constructor(readonly file: File) {}
}
export type UploadFileEvent = UploadFileStartEvent | UploadFileSuccessEvent | UploadFileEndEvent | UploadFileErrorEvent | CancelUploadFileEvent;
export type FileEvent = RemoveFileEvent | DownloadFileEvent | UploadFileEvent;

export type ViewerExtendedFileVm = ViewerFileVm & {
    id: number;
    fileType: string;
    actions: ActionDescriptor[];
    menuActions: ActionDescriptor[];
};
