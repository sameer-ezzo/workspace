import { Pipe, PipeTransform } from '@angular/core';
import { FileInfo } from '@noah-ark/common';


@Pipe({ name: 'fileIcon' })
export class FileIconPerTypePipe implements PipeTransform {
    transform(value: FileInfo | File, ...args: any[]): string {
        return this._getFileType(value);
    }

    private _getFileType(file: any) {


        const mimetype = file?.mimetype ?? '';

        if (mimetype.startsWith('image/svg'))
            return 'svg';
        if (mimetype.startsWith('image/'))
            return 'image';
        if (mimetype.startsWith('video/'))
            return 'video';
        if (mimetype.startsWith('audio/'))
            return 'audio';
        if (mimetype.startsWith('font/'))
            return 'font';

        switch (mimetype) {
            case 'text/plain':
            case 'text/application/rtf': return 'txt';

            case 'application/pdf': return 'pdf';

            case 'application/zip':
            case 'application/x-tar':
            case 'application/x-7z-compressed':
            case 'application/vnd.rar': return 'zip';

            case 'application/x-httpd-php': return 'php';

            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': return 'ppt';

            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'xls';

            default: return 'file';
        }
    }
}
