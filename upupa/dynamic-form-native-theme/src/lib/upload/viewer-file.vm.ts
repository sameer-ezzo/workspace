import { ActionDescriptor } from '@upupa/common';
import { FileInfo, UploadStream } from '@upupa/upload';


type ViewerFileVm = {
    file: File | FileInfo;
    uploadTask?: UploadStream;
    error?: any;
};
export type SelectInputFileVm = ViewerFileVm & {
    id: number;
};
export type FileEvent = { name: 'focused' | 'selected' | 'removed' | 'canceled' | 'requestResume', files: SelectInputFileVm[] }



export type ViewerExtendedFileVm = SelectInputFileVm & {
    fileType: string,
    actions: ActionDescriptor[],
    menuActions: ActionDescriptor[]
}
