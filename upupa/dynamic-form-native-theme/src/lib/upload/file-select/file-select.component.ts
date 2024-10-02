import {
    Component,
    DestroyRef,
    HostBinding,
    HostListener,
    Input,
    OnDestroy,
    forwardRef,
    inject,
    input,
    signal,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
    ActionDescriptor,
    ActionEvent,
    EventBus,
    InputBaseComponent,
} from '@upupa/common';
import { Subject, firstValueFrom, lastValueFrom, takeUntil, tap } from 'rxjs';
import {
    ClipboardService,
    FileInfo,
    openFileDialog,
    UploadClient,
} from '@upupa/upload';
import { ThemePalette } from '@angular/material/core';
import { AuthService } from '@upupa/auth';
import { FileUploadService } from '../file-upload.service';
import { FileEvent, SelectInputFileVm } from '../viewer-file.vm';
import { DialogService } from '@upupa/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type ViewType = 'list' | 'grid';
@Component({
    selector: 'file-select',
    templateUrl: './file-select.component.html',
    styleUrls: ['./file-select.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileSelectComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => FileSelectComponent),
            multi: true,
        },
    ],
    exportAs: 'fileSelect',
    host: {
        class: 'view()',
    },
})
export class FileSelectComponent extends InputBaseComponent<FileInfo[]> {
    @Input() color: ThemePalette = 'accent';
    @Input() dateFormat = 'dd MMM yyyy';
    @Input() placeholder: string;
    @Input() label: string;
    @Input() hint: string;
    @Input() readonly = false;
    @Input() errorMessages: { [errorCode: string]: string } = {};

    @Input() hideSelectButton = false;
    @Input() includeAccess = false;
    // @Input() base = this.uploadClient.baseOrigin;
    path = input<string, string>('', {
        transform: (v) => {
            const v_lower = (v ?? '').toLocaleLowerCase();
            return v_lower === 'undefined' || v_lower === 'null' ? '' : v;
        },
    });

    @Input() minAllowedFiles = 0;
    @Input() maxAllowedFiles = 1;
    @Input() minSize = 0;
    @Input() maxFileSize = 1024 * 1024 * 10; //10 MB
    @Input() maxSize = 1024 * 1024 * 10; //10 MB

    accept = input<string, string>('*.*', {
        transform: (v) => (v ?? '*.*').toLocaleLowerCase(),
    });

    view = input.required<ViewType, ViewType>({
        transform: (v: ViewType) => v ?? 'list',
    });
    @Input() fileSelector: 'browser' | 'system' = 'system';
    viewFiles = input(true);

    @Input() fileValidator: (file: File) => Promise<Record<string, string>>;
    @Input() enableDragDrop = false;

    @Input() actions = [
        {
            action: 'download',
            variant: 'icon',
            text: 'Download',
            icon: 'get_app',
        } as ActionDescriptor,
        {
            action: 'remove',
            variant: 'icon',
            text: 'Remove',
            icon: 'delete',
        } as ActionDescriptor,
    ];
    dragging = false;
    viewModel = signal<SelectInputFileVm[]>([]);
    private readonly destroyRef = inject(DestroyRef);

    @HostListener('blur', ['$event'])
    onBlur(event) {
        event.preventDefault();
        this.control?.markAsTouched();
    }

    constructor(
        public readonly uploadClient: UploadClient,
        private readonly auth: AuthService,
        private readonly bus: EventBus,
        private readonly fileUploader: FileUploadService,
        private readonly clipboard: ClipboardService,
        public readonly dialog: DialogService
    ) {
        super();
        // this.base ??= uploadClient.baseUrl

        this.value1$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((v) => {
                this.viewModel.set(
                    (v ?? []).map(
                        (f, id) =>
                            ({ id, file: f, error: null } as SelectInputFileVm)
                    )
                );
            });

        this.clipboard.paste$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(async (event) => {
                // make sure this component is focused or active
                if (
                    event.clipboardData.files &&
                    event.clipboardData.files.length
                )
                    await this.uploadFileList(event.clipboardData.files);
                else {
                    console.warn('paste', event);
                    //else uploadByContent text or html or ...
                }
            });
    }

    selectFile() {
        const viewer = this.fileSelector;
        if (viewer === 'browser') this.showFileExplorer();
        else this.showFileDialog();
    }

    uploading = false;
    files: File[];
    private async showFileDialog() {
        const accept = (this.accept) ?? this.accept?.() ?? '';
        const files = await openFileDialog(
            accept as string,
            this.maxAllowedFiles !== 1
        );
        this.files = Array.from(files);
        try {
            this.uploading = true;
            await this.uploadFileList(files);
            this.uploading = false;
        } catch (e) {
            console.error(e);
        }
    }

    private async showFileExplorer() {
        // FileBrowserComponent depends on this component so we need to find a better solution to use it

        if (this.value?.length >= this.maxAllowedFiles) return;

        // const dref = this.dialog.openDialog(FileBrowserComponent, {
        //     title: 'upload',
        //     inputs: {
        //         includeAccess: this.includeAccess,
        //         path: this.path,
        //         minAllowedFiles: this.minAllowedFiles,
        //         maxAllowedFiles: this.maxAllowedFiles,
        //         minSize: this.minSize,
        //         maxSize: this.maxSize,
        //         accept: this.accept,
        //         view: this.view,
        //         value: this.value
        //     },
        //     actions: [
        //         { name: 'close', text: 'Close', meta: { closeDialog: true }, variant: 'button' } as ActionDescriptor,
        //         { name: 'select', type: 'submit', text: 'Select', meta: { closeDialog: true }, variant: 'raised', color: 'primary' } as ActionDescriptor
        //     ]
        // })

        // const result = await firstValueFrom(dref.afterClosed())
        // if (result) {
        //     this.value = result
        //     this.control.markAsDirty()
        // }
    }
    private _validateFileList(f: FileList) {
        return Array.from(f)
            .slice()
            .map(async (file, id) => {
                const extensionErrors = this.validateFileExtensions(
                    file,
                    this.accept as any
                );
                const maxSizeErrors = this.validateFileMaxSize(
                    file,
                    this.maxFileSize
                );
                const minSizeErrors = this.validateFileMinSize(
                    file,
                    this.minSize
                );
                const validatorError = this.fileValidator
                    ? await this.fileValidator(file)
                    : null;
                const error = Object.assign(
                    {},
                    validatorError,
                    extensionErrors,
                    maxSizeErrors,
                    minSizeErrors
                );

                const res = {
                    id,
                    file,
                    error:
                        Object.getOwnPropertyNames(error).length > 0
                            ? error
                            : null,
                } as SelectInputFileVm;
                return res;
            });
    }
    async uploadFileList(f: FileList) {
        const validationResults = this._validateFileList(f);

        const validatedFilesReport = (
            await Promise.allSettled(validationResults)
        ).map((f) => {
            if (f.status === 'fulfilled')
                return f['value'] as SelectInputFileVm;
            return { ...f['value'], error: f['reason'] } as SelectInputFileVm;
        });
        const errors = validatedFilesReport.filter((f) => f.error);
        if (errors.length > 0) {
            this.viewModel.set([...this.viewModel(), ...errors]);
            return;
        }
        // const tasks = validatedFilesReport.map((f) => this.setUploadTask(f));
        // .map((f) => lastValueFrom(f.uploadTask.response$));

        this.viewModel.set([...this.viewModel(), ...validatedFilesReport]);

        // await Promise.allSettled(tasks);
    }

    private setUploadTask(fvm: SelectInputFileVm) {
        fvm.uploadTask = this.fileUploader.upload(
            this.path(),
            fvm.file as File
        );

        fvm.uploadTask?.response$
            .pipe(
                tap((f) => {
                    if (!fvm.uploadTask.connection) {
                        fvm.error = { error: 'canceled' };
                        fvm.uploadTask = null;
                    }
                })
            )
            .subscribe({
                next: (f) => {
                    fvm.file = f;
                    this.viewModel.set(this.viewModel().slice());
                },
                error: (e) => {
                    fvm.error = { error: e.error.message };
                    fvm.uploadTask = null;
                    this.control.markAsDirty();
                    this.viewModel.set(this.viewModel().slice());
                },
                complete: () => {
                    fvm.uploadTask = null;
                    this.viewModel.set(this.viewModel().slice());
                    if (
                        this.viewModel().filter((v) => v.uploadTask).length ===
                        0
                    )
                        this.value = [
                            ...(this.value ?? []),
                            fvm.file as FileInfo,
                        ];
                },
            });

        return fvm;
    }

    selectionChanged(e) {
        this.value = e;
        this._propagateChange();
        this.control.markAsDirty();
    }

    viewerEventsHandler(e: FileEvent) {
        if (e.name === 'removed') {
            e.files.forEach((f) =>
                this.viewModel().splice(
                    this.viewModel().findIndex((c) => c.id === f.id),
                    1
                )
            );
            this.viewModel.set(this.viewModel().slice());
        }
        if (e.name === 'requestResume') {
            e.files.forEach((f) => {
                this.setUploadTask(f);
            });
        }
    }

    async onAction(e: ActionEvent) {
        if (e.action.name === 'remove') this.removeFile(e.data[0]);
        if (e.action.name === 'download') this.downloadFile(e.data[0]);
        this.bus.emit(`${this.name}-${e.action.name}`, e, this);
    }

    removeFile(file: FileInfo) {
        const i = this.value.indexOf(file);
        this.value.splice(i, 1);
        this.value = this.value.slice();
        this.control.markAsDirty();
    }

    downloadFile(file: FileInfo) {
        const r = window.open(
            `${file.path}?access_token=${this.auth.get_token()}`,
            '_blank'
        );
        r.onloadeddata = () => {
            r.close();
        };
    }

    private validateFileExtensions(file: File, accepts: string) {
        if (!accepts) return null;
        const validateByMime = accepts.indexOf('/') > -1;
        if (validateByMime) {
            // accept="image/*" or "image/png,image/jpeg" or "image/png, image/jpeg" validate file by mime type

            const terms = accepts
                .split(',')
                .map((a) => a.toLowerCase())
                .map((a) => a.split('/'));
            const fileMime = file.type.split('/');
            return terms.some(
                (t) =>
                    (t[0] === '*' || t[0] === fileMime[0]) &&
                    (t[1] === '*' || t[1] === fileMime[1])
            )
                ? null
                : { extension: file.type, accepts };
        } else if (file && accepts && accepts.indexOf('*.*') === -1) {
            const segments = file.name.split('.');

            const ext = segments[segments.length - 1].toLowerCase();
            return accepts.indexOf(ext) > -1
                ? null
                : { extension: `.${ext}`, accepts };
        }
        return null;
    }
    private validateFileMaxSize(file: File, maxSize: number) {
        if (file && maxSize > 0) {
            return file.size > maxSize ? { ['max-size']: file.size } : null;
        }
        return null;
    }
    private validateFileMinSize(file: File, minSize: number) {
        if (file && minSize > 0) {
            return file.size < minSize ? { ['min-size']: file.size } : null;
        }
        return null;
    }

    async onDrop(event) {
        event.preventDefault();
        this.dragging = false;
        await this.uploadFileList(event.dataTransfer.files);
    }

    dragLeave(e) {
        this.dragging = false;
    }
    dragOver(e) {
        if (!this.readonly) this.dragging = true;
    }
}
