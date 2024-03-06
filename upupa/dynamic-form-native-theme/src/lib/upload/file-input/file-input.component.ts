import { Component, Input, forwardRef, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ThemePalette } from '@angular/material/core';
import { DataService, ClientDataSource, DataAdapter } from '@upupa/data';
import { ActionDescriptor, ActionEvent, DialogService } from '@upupa/common';
import { filter, map, takeUntil } from 'rxjs/operators';
import { FileSelectComponent } from '../file-select/file-select.component';

import { AuthService } from '@upupa/auth';
import { ClipboardService, FileInfo, openFileDialog, UploadClient } from '@upupa/upload';
import { DataComponentBase } from '@upupa/table';
import { firstValueFrom } from 'rxjs';



@Component({
    selector: 'file-input',
    templateUrl: './file-input.component.html',
    styleUrls: ['./file-input.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileInputComponent),
            multi: true,
        },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => FileInputComponent), multi: true }
    ]
})
export class FileInputComponent extends DataComponentBase {

    @Input() includeAccess = false;
    @Input() base = '';
    @Input() path = '';

    @Input() color: ThemePalette = 'accent';
    @Input() dateFormat = 'dd MMM yyyy';
    @Input() placeholder: string;
    @Input() label: string;
    @Input() hint: string;
    @Input() readonly = false;
    @Input() errorMessages: { [errorCode: string]: string } = {};


    @Input() minAllowedFiles = 0;
    @Input() maxAllowedFiles = 1;
    @Input() minSize = 0;
    @Input() maxSize = 1024 * 1024 * 10; //10 MB
    @Input() accept: string;

    @Input() view: 'list' | 'grid' = 'list'
    @Input() fileSelector: 'browser' | 'system' = 'system'

    constructor(public uploadClient: UploadClient,
        public data: DataService,
        public auth: AuthService,
        public clipboard: ClipboardService,
        public dialog: DialogService) {
        super()
        this.base = uploadClient.baseUrl;
    }

    actions = [
        { name: 'download', text: 'Download', icon: 'get_app' } as ActionDescriptor,
        { name: 'remove', text: 'Remove', icon: 'clear' } as ActionDescriptor,
    ]

    onAction(e: ActionEvent) {
        if (e.action.name === 'remove') {
            this.removeFile(e.data[0].item)
        }
    }

    dataAdapter = this.value1$.pipe(
        filter(v => v != null || v != undefined),
        map(v => {
            const x = Array.isArray(v) ? v : [v]
            return new DataAdapter(new ClientDataSource(x), '_id', undefined, undefined, undefined)
        })
    )

    access_token = null;
    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        await super.ngOnChanges(changes)
        if (changes['control'] && this.control) {
            this.value = this.control.value;

        }
        if (this.includeAccess === true) {
            this.auth.user$.pipe(takeUntil(this.destroy$)).subscribe(t => this.access_token = `?access_token=${this.auth.get_token()}`);
        }
    }



    private validateFileExtensions(file: File, accepts: string) {
        if (file && accepts) {
            const segments = file.name.split(".");
            segments.shift();
            const fileExtension = segments.join('.').toLowerCase();
            const extensions = accepts.split(',').filter(x => x != '*.*').map(x => x.startsWith('.') ? x.substring(1).toLowerCase() : x.toLowerCase());
            return extensions.some(x => x === fileExtension || x === file.type) ? null : { extension: fileExtension };
        }
        return null;
    }
    private validateFileMaxSize(file: File, maxSize: number) {
        if (file && maxSize > 0) {
            return file.size > maxSize ? { ['max-size']: file.size } : null;
        }
        return null;
    }
    private validateFileMinSize(file: File, mninSize: number) {
        if (file && mninSize > 0) {
            return file.size < mninSize ? { ['min-size']: file.size } : null;
        }
        return null;
    }


    uploading = false;
    uploadingProgress: number | null = null;
    async selectFile() {

        if (this.fileSelector === 'browser') {
            return await this.showFileExplorer();
        }

        const files = await openFileDialog(this.accept, this.maxAllowedFiles !== 1);

        this.uploading = files.length > 0;
        let uploadedFiles = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const extensionErrors = this.validateFileExtensions(file, this.accept);

            const maxSizeErrors = this.validateFileMaxSize(file, this.maxSize);
            const minSizeErrors = this.validateFileMinSize(file, this.minSize);

            if (extensionErrors?.extension?.length > 0 || maxSizeErrors || minSizeErrors) {
                const errors = Object.assign({}, extensionErrors, maxSizeErrors, minSizeErrors);
                this.control.setErrors(errors);
                this.control.markAllAsTouched();
                continue;
            }

            const uploadStream = this.uploadClient.upload(this.path, files[i], files[i].name);
            uploadStream.progress$.subscribe(p => this.uploadingProgress = p);
            uploadStream.response$.subscribe(res => {
                //this.value = res;
                uploadedFiles++;
                this.uploading = files.length > uploadedFiles;
                let r = null as FileInfo[];
                if (!Array.isArray(res)) r = [res];
                else r = res;
                // this.value = [...(this.value || []), ...r];
            });
        }


    }

    private async showFileExplorer() {
        const result = this.dialog.open(FileSelectComponent, {
            data: { path: this.path, base: this.base, value: this.value }
        });
        //todo: convert selectionChanged to eventEmitter instead of replaySubject. 
        // result.componentInstance.selectionChanged.subscribe(e => {
        //     result.close(e);
        // });

        this.value = await firstValueFrom(result.afterClosed());
        this.control.markAsDirty()
    }



    removeFile(file: FileInfo) {
        const i = this.value.indexOf(file)
        this.value.splice(i, 1)
        this.control.markAsDirty()
    }
}