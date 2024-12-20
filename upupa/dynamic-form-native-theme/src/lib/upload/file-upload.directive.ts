import { Directive, inject, Input, PLATFORM_ID } from "@angular/core";
import { ActionDescriptor, DialogService } from "@upupa/common";
import { firstValueFrom, tap } from "rxjs";
import { ClipboardService, FileInfo, openFileDialog, UploadClient } from "@upupa/upload";
import { FileUploadService } from "./file-upload.service";
import { SelectInputFileVm } from "./viewer-file.vm";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FileBrowserComponent } from "./file-browser/file-browser.component";
import { isPlatformBrowser } from "@angular/common";

@Directive({
    selector: "file",
    exportAs: "file",
    standalone: true,
})
export class FileUploadDirective {
    @Input() readonly = false;
    @Input() errorMessages: { [errorCode: string]: string } = {};
    @Input() path = "";
    @Input() minAllowedFiles = 0;
    @Input() maxAllowedFiles = 1;
    @Input() minSize = 0;
    @Input() maxFileSize = 1024 * 1024 * 10; //10 MB
    @Input() maxSize = 1024 * 1024 * 10; //10 MB
    @Input() accept: string;
    @Input() fileSelector: "browser" | "system" = "system";
    @Input() fileValidator: (file: File) => Promise<Record<string, string>>;
    @Input() enableDragDrop = true;

    @Input() includeAccess: boolean;
    @Input() view: "list" | "grid" = "list";

    dragging = false;
    viewModel: SelectInputFileVm[] = [];

    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    clipboard? = this.isBrowser ? inject(ClipboardService) : null;

    constructor(
        public readonly uploadClient: UploadClient,
        private readonly fileUploader: FileUploadService,
        public readonly dialog: DialogService,
    ) {
        this.clipboard?.paste$.pipe(takeUntilDestroyed()).subscribe(async (event) => {
            // make sure this component is focused or active
            if (event.clipboardData.files && event.clipboardData.files.length) await this.uploadFileList(event.clipboardData.files);
            else {
                console.log("paste", event);
                //else uploadByContent text or html or ...
            }
        });
    }

    selectFile() {
        if (this.fileSelector !== "browser") this.showFileDialog();
        else this.showFileExplorer();
    }

    private async showFileDialog() {
        const files = await openFileDialog(this.accept, this.maxAllowedFiles !== 1);
        await this.uploadFileList(files);
    }

    private async showFileExplorer() {
        const dref = this.dialog.openDialog(FileBrowserComponent, {
            title: "upload",
            inputs: {
                includeAccess: this.includeAccess,
                path: this.path,
                minAllowedFiles: this.minAllowedFiles,
                maxAllowedFiles: this.maxAllowedFiles,
                minSize: this.minSize,
                maxSize: this.maxSize,
                accept: this.accept,
                view: this.view,
            },
            actions: [
                { name: "close", text: "Close", meta: { closeDialog: true }, variant: "button" } as ActionDescriptor,
                { name: "select", type: "submit", text: "Select", meta: { closeDialog: true }, variant: "raised", color: "primary" } as ActionDescriptor,
            ],
        });

        const result = await firstValueFrom(dref.afterClosed());
        // emit result as file uploaded or selected
    }

    async uploadFileList(f: FileList) {
        const filesPs = Array.from(f)
            .slice()
            .map(async (file, id) => {
                const extensionErrors = this.validateFileExtensions(file, this.accept);
                const maxSizeErrors = this.validateFileMaxSize(file, this.maxFileSize);
                const minSizeErrors = this.validateFileMinSize(file, this.minSize);
                const validatorError = this.fileValidator ? await this.fileValidator(file) : null;
                const error = Object.assign({}, validatorError, extensionErrors, maxSizeErrors, minSizeErrors);
                const res = { id, file, error: Object.getOwnPropertyNames(error).length > 0 ? error : null } as SelectInputFileVm;
                return res;
            });

        const files = (await Promise.allSettled(filesPs)).map((f) => {
            if (f.status === "fulfilled") return f["value"] as SelectInputFileVm;
            return { ...f["value"], error: f["reason"] } as SelectInputFileVm;
        });

        for (const fvm of files) {
            if (fvm.error) continue;
            this.setUploadTask(fvm);
        }

        this.viewModel = [...this.viewModel, ...files];
    }

    private setUploadTask(fvm: SelectInputFileVm) {
        fvm.uploadTask = this.fileUploader.upload(this.path, fvm.file as File);

        fvm.uploadTask?.response$
            .pipe(
                tap((f) => {
                    if (!fvm.uploadTask.connection) {
                        fvm.error = { error: "canceled" };
                        fvm.uploadTask = null;
                    }
                }),
            )
            .subscribe({
                next: (f) => {
                    fvm.file = f;
                },
                error: (e) => {
                    fvm.error = e.status === 0 ? { error: "canceled" } : e.error;
                    fvm.uploadTask = null;
                    this.control.markAsDirty();
                    this.viewModel = this.viewModel.slice();
                },
                complete: () => {
                    fvm.uploadTask = null;
                    this.viewModel = this.viewModel.slice();
                    if (this.viewModel.filter((v) => v.uploadTask).length === 0) this.value = [...(this.value ?? []), fvm.file as FileInfo];
                },
            });
    }

    selectionChanged(e) {
        this.value = e;
        this.propagateChange();
        this.control.markAsDirty();
    }

    private validateFileExtensions(file: File, accepts: string) {
        if (file && accepts && accepts.indexOf("*.*") == -1) {
            const segments = file.name.split(".");

            const ext = segments[segments.length - 1].toLowerCase();
            return accepts.indexOf(ext) > -1 ? null : { extension: `.${ext}`, accepts };
        }
        return null;
    }
    private validateFileMaxSize(file: File, maxSize: number) {
        if (file && maxSize > 0) {
            return file.size > maxSize ? { ["max-size"]: file.size } : null;
        }
        return null;
    }
    private validateFileMinSize(file: File, mninSize: number) {
        if (file && mninSize > 0) {
            return file.size < mninSize ? { ["min-size"]: file.size } : null;
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
