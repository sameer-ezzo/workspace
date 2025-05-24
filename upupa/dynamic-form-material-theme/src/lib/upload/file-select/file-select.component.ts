import { Component, DestroyRef, ElementRef, HostListener, PLATFORM_ID, computed, effect, forwardRef, inject, input, output, signal } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { ErrorsDirective, InputBaseComponent } from "@upupa/common";
import { filter } from "rxjs";
import { ClipboardService, FileInfo, openFileDialog, UploadClient } from "@upupa/upload";
import { ThemePalette } from "@angular/material/core";
import { FileEvent, RemoveFileEvent, UploadFileSuccessEvent, ViewerExtendedFileVm } from "../viewer-file.vm";

import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule, DOCUMENT, isPlatformBrowser } from "@angular/common";

import { MatError, MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { FilesViewerComponent } from "../file-viewer/file-viewer.component";
import { DialogService } from "@upupa/dialog";

type ViewType = "list" | "grid";
@Component({
    selector: "file-select",
    templateUrl: "./file-select.component.html",
    styleUrls: ["./file-select.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileSelectComponent),
            multi: true,
        },
    ],
    host: {
        "[class]": "view()",
        "[attr.name]": "name()",
    },
    imports: [CommonModule, FormsModule, ReactiveFormsModule, MatError, MatButtonModule, ErrorsDirective, MatFormFieldModule, MatIconModule, FilesViewerComponent],
})
export class FileSelectComponent extends InputBaseComponent<FileInfo[]> {
    color = input<ThemePalette>("accent");
    dateFormat = input("dd MMM yyyy");
    placeholder = input("");
    label = input("");
    hint = input("");
    readonly = input(false);

    hideSelectButton = input(false);
    canUpload = computed(() => !this.readonly() && (this.value() ?? []).length < this.maxAllowedFiles());
    includeAccess = input(false);

    // @Input() base = this.uploadClient.baseOrigin;
    path = input.required<string, string>({ transform: (v: string) => v || "/" });

    minAllowedFiles = input<number, number | undefined>(0, {
        transform: (v) => {
            return Math.max(0, v ?? 0);
        },
    });
    maxAllowedFiles = input<number, number | undefined>(1, {
        transform: (v) => {
            return Math.max(1, v ?? Number.MAX_SAFE_INTEGER);
        },
    });
    minSize = input(0);
    maxFileSize = input(1024 * 1024 * 10); //10 MB
    maxSize = input(1024 * 1024 * 10); //10 MB

    accept = input<string, string>("*.*", {
        transform: (v) => (v ?? "*.*").toLocaleLowerCase(),
    });

    view = input("list", {
        transform: (v: ViewType) => (v === "list" ? "list" : "grid"),
    });

    fileSelector = input<"browser" | "system">("system");
    viewFiles = input(true);

    enableDragDrop = input(false);

    dragging = signal(false);
    viewModel = signal<ViewerExtendedFileVm[]>([]);

    private readonly destroyRef = inject(DestroyRef);
    base = signal<string>("");

    @HostListener("blur", ["$event"])
    onBlur(event) {
        event.preventDefault();
        this.markAsTouched();
    }

    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    clipboard? = this.isBrowser ? inject(ClipboardService) : undefined;

    private readonly host = inject(ElementRef);
    constructor(
        public readonly uploadClient: UploadClient,
        public readonly dialog: DialogService,
    ) {
        super();

        this.base.set(new URL(uploadClient.baseUrl).origin + "/");

        effect(() => {
            const v = this.value();
            this.viewModel.set((v ?? []).map((f, id) => ({ id, file: f, error: null }) as ViewerExtendedFileVm));
        });

        this.clipboard?.paste$
            .pipe(
                filter((e) => !this.readonly() && this.host.nativeElement.contains(e.target)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(async (event) => {
                // make sure this component is focused or active
                if (event.clipboardData.files && event.clipboardData.files.length) await this.uploadFileList(event.clipboardData.files);
                else {
                    console.warn("paste", event);
                    //else uploadByContent text or html or ...
                }
            });
    }

    selectFile() {
        if (!this.canUpload()) return;
        const viewer = this.fileSelector();
        if (viewer === "browser") this.showFileExplorer();
        else this.showFileDialog();
    }

    private readonly doc = inject(DOCUMENT);
    private async showFileDialog() {
        const accept = this.accept() ?? "";
        const files = await openFileDialog(this.doc, accept as string, this.maxAllowedFiles() !== 1);
        await this.uploadFileList(files);
    }

    private async showFileExplorer() {
        //!important FileBrowserComponent depends on this component so we need to find a better solution to use it
        // if (this.value?.length >= this.maxAllowedFiles()) return;
        // const dref = this.dialog.open(
        //     {
        //         component: FileBrowserComponent,
        //         inputs: {
        //             path: this.path(),
        //             view: this.view(),
        //             value: this.value(),
        //             // includeAccess: this.includeAccess(),
        //             // minAllowedFiles: this.minAllowedFiles(),
        //             // maxAllowedFiles: this.maxAllowedFiles(),
        //             // minSize: this.minSize(),
        //             // maxSize: this.maxSize(),
        //             // accept: this.accept(),
        //         },
        //     },
        //     {
        //         title: "Select",
        //         // actions: [
        //         //     { name: "close", text: "Close", meta: { closeDialog: true }, variant: "button" } as ActionDescriptor,
        //         //     { name: "select", type: "submit", text: "Select", meta: { closeDialog: true }, variant: "raised", color: "primary" } as ActionDescriptor,
        //         // ],
        //     },
        // );
        // const result = await firstValueFrom(dref.afterClosed());
        // if (result) {
        //     this.handleUserInput(result);
        // }
    }
    private _validateFileList(f: FileList) {
        return Array.from(f)
            .slice()
            .map((file, idx) => {
                const extensionErrors = this.validateFileExtensions(file, this.accept());
                const maxSizeErrors = this.validateFileMaxSize(file, this.maxFileSize());
                const minSizeErrors = this.validateFileMinSize(file, this.minSize());

                const error = Object.assign({}, extensionErrors, maxSizeErrors, minSizeErrors);

                const res = {
                    id: idx,
                    file,
                    error: Object.getOwnPropertyNames(error).length > 0 ? error : null,
                } as ViewerExtendedFileVm;
                return res;
            });
    }

    selectionChanged(e) {
        this.value.set(e);
        this.propagateChange();
        this.markAsTouched();
    }

    async uploadFileList(f: FileList) {
        if (!this.canUpload()) return;
        const newFiles = this._validateFileList(f);
        this.viewModel.update((v) => [...v, ...newFiles]);
    }

    events = output<FileEvent>();

    viewerEventsHandler(e: FileEvent) {
        this.events.emit(e);
        if (e instanceof RemoveFileEvent) {
            this.viewModel.update((v) => v.filter((f) => f.file !== e.file));
            const vm = this.viewModel()
                .filter((f) => !f.error && !(f.file instanceof File))
                .map((f) => f.file as FileInfo);
            this.handleUserInput(vm);
        } else if (e instanceof UploadFileSuccessEvent) {
            const f = e.file as File;
            const fileInfo = e.fileInfo as FileInfo;
            const vm = this.viewModel().map((vf) => {
                if (vf.file === f) {
                    vf.file = fileInfo;
                    return { ...vf };
                }
                return vf;
            });
            this.viewModel.set(vm);
            this.handleUserInput(vm.filter((f) => !f.error && !(f.file instanceof File)).map((f) => f.file as FileInfo));
        }
    }

    private validateFileExtensions(file: File, accepts: string) {
        if (!accepts) return null;
        const validateByMime = accepts.indexOf("/") > -1;
        if (validateByMime) {
            // accept="image/*" or "image/png,image/jpeg" or "image/png, image/jpeg" validate file by mime type

            const terms = accepts
                .split(",")
                .map((a) => a.toLowerCase())
                .map((a) => a.split("/"));
            const fileMime = file.type.split("/");
            return terms.some((t) => (t[0] === "*" || t[0] === fileMime[0]) && (t[1] === "*" || t[1] === fileMime[1])) ? null : { extension: file.type, accepts };
        } else if (file && accepts && accepts.indexOf("*.*") === -1) {
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
    private validateFileMinSize(file: File, minSize: number) {
        if (file && minSize > 0) {
            return file.size < minSize ? { ["min-size"]: file.size } : null;
        }
        return null;
    }

    async onDrop(event) {
        event.preventDefault();
        this.dragging.set(false);
        await this.uploadFileList(event.dataTransfer.files);
    }

    dragLeave(e) {
        this.dragging.set(false);
    }
    dragOver(e) {
        if (this.canUpload()) this.dragging.set(true);
    }
}
