import { Component, Input, forwardRef, OnChanges, SimpleChanges, OnDestroy, Output, EventEmitter } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ThemePalette } from '@angular/material/core';
import { DataService } from '@upupa/data';
import { DialogService, InputBaseComponent } from '@upupa/common';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { AuthService } from '@upupa/auth';
import { ClipboardService, openFileDialog } from '@upupa/upload';

@Component({
    selector: 'local-file-input',
    templateUrl: './local-file-input.component.html',
    styleUrls: ['./local-file-input.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LocalFileInputComponent),
            multi: true,
        },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => LocalFileInputComponent), multi: true }

    ]
})
export class LocalFileInputComponent extends InputBaseComponent implements OnChanges, OnDestroy {
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


    destroyed = new Subject<void>();
    @Input() includeAccess: boolean;


    uploading = false;
    uploadingProgress: number | null = null;
    access_token = null;

    constructor(public data: DataService,
        private auth: AuthService,
        public clipboard: ClipboardService,
        public dialog: DialogService) {
        super();
    }
    ngOnDestroy(): void {
        this.destroyed.next();
        this.destroyed.complete();
    }

    override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes)
        if (this.includeAccess === true) {
            this.auth.token$.pipe(takeUntil(this.destroyed)).subscribe(t => this.access_token = `?access_token=${t}`);
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


    async selectFile() {
        const files = await openFileDialog(this.accept, this.maxAllowedFiles !== 1);
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
        }

        if (Object.keys(this.control.errors ?? {}).length === 0) {
            if (this.maxAllowedFiles > 1) this.value = Array.from(files);
            else this.value = files.item(0);
        }
    }

    removeFile(file: File) {
        if (Array.isArray(this.value)) {
            const i = this.value.indexOf(file);
            this.value.splice(i, 1);
            this.value = this.value.filter(x => x);
        }
        else this.value = null
    }
}