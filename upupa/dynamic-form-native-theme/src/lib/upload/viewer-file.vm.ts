import { ActionDescriptor } from '@upupa/common';
import { FileInfo, UploadStream } from '@upupa/upload';

type ViewerFileVm = {
    fileName: string;
    file: File | FileInfo;
    uploadTask?: UploadStream;
    error?: any;
};
export type RemoveFileEvent = { name: 'remove'; file: File | FileInfo };
export type DownloadFileEvent = { name: 'download'; file: File | FileInfo };
export type UploadFileStartEvent = { name: 'uploadStart'; stream: UploadStream; file: File };
export type UploadFileSuccessEvent = { name: 'uploadSuccess'; stream: UploadStream; fileInfo: FileInfo; file: File };
export type UploadFileEndEvent = { name: 'uploadEnd'; fileInfo?: FileInfo; file: File };
export type UploadFileErrorEvent = { name: 'uploadError'; message: string; error: any; file: File };
export type CancelUploadFileEvent = { name: 'cancelUpload'; file: File };
export type UploadFileEvent = UploadFileStartEvent | UploadFileSuccessEvent | UploadFileEndEvent | UploadFileErrorEvent | CancelUploadFileEvent;
export type FileEvent = RemoveFileEvent | DownloadFileEvent | UploadFileEvent;

export type ViewerExtendedFileVm = ViewerFileVm & {
    id: number;
    fileType: string;
    actions: ActionDescriptor[];
    menuActions: ActionDescriptor[];
};
