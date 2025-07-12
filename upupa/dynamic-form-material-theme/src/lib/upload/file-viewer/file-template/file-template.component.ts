import { Component, computed, inject, input, output, signal, SimpleChanges, ViewEncapsulation, DOCUMENT } from "@angular/core";
import { ActionDescriptor } from "@upupa/common";
import {
    CancelUploadFileEvent,
    DownloadFileEvent,
    FileEvent,
    RemoveFileEvent,
    UploadFileEndEvent,
    UploadFileErrorEvent,
    UploadFileStartEvent,
    UploadFileSuccessEvent,
    ViewerExtendedFileVm,
} from "../../viewer-file.vm";
import { FileInfo } from "@noah-ark/common";
import { FileIconPerTypePipe } from "../../file-icon-per-type.pipe";
import { FileUploadService } from "../../file-upload.service";
import { Subscription } from "rxjs";
import { FileSizePipe, UploadStream } from "@upupa/upload";
import { AuthService } from "@upupa/auth";
import { AsyncPipe, DatePipe } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatBtnComponent } from "@upupa/mat-btn";

import { ConfirmService, DialogService, SnackBarService } from "@upupa/dialog";

const actions = [
    (item: File | FileInfo) =>
        ({
            name: "download",
            variant: "icon",
            text: "Download",
            icon: "get_app",
            menu: true,
        }) as ActionDescriptor,
    (item: File | FileInfo) =>
        ({
            name: "copy_url",
            variant: "icon",
            text: "Copy Url",
            icon: "content_copy",
            menu: true,
        }) as ActionDescriptor,
    (item: File | FileInfo) =>
        ({
            name: "remove",
            variant: "icon",
            text: "Remove",
            icon: "delete",
            menu: true,
        }) as ActionDescriptor,
];
// class="file hoverable" [class.loading]="fileVm.uploadTask"
@Component({
    selector: "file-template",
    templateUrl: "./file-template.component.html",
    styleUrls: ["./file-template.component.scss"],
    // encapsulation: ViewEncapsulation.None,
    providers: [FileUploadService],
    host: {
        "[class]": "class()",
    },
    imports: [MatIconModule, MatButtonModule, DatePipe, AsyncPipe, MatMenuModule, MatBtnComponent, FileSizePipe],
})
export class FileTemplateComponent {
    private readonly auth = inject(AuthService);
    class = computed(() => {
        return "file hoverable" + (this.stream() ? " loading" : "");
    });

    file = input.required<ViewerExtendedFileVm>();

    selectable = input(false);
    dateFormat = input("dd MMM yyyy");
    imageDim = input(65);
    base = input("");
    includeAccess = input(false);
    events = output<FileEvent>();
    private readonly fi = new FileIconPerTypePipe();
    imageSrc = signal<string>(undefined);
    confirm = inject(ConfirmService);

    vm = signal<ViewerExtendedFileVm>(undefined);
    ngOnChanges(changes: SimpleChanges) {
        if (changes["file"]) {
            const file = this.file();
            this.vm.set(this.convertToVm(file));
            const f = file.file;
            let src = "";
            if (f instanceof File) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    src = e.target.result as string;
                    this.imageSrc.set(src + (this.includeAccess() ? `?access_token=${this.auth.get_token()}` : ""));
                };
                reader.readAsDataURL(f);
                this.startUpload(file);
            } else {
                if (file.fileType !== "image") src = `/assets/upload/files-icons/${this.fi.transform(f)}.svg`;
                else src = this.base() + f.path;
                this.imageSrc.set(src + (this.includeAccess() ? `?access_token=${this.auth.get_token()}` : ""));
            }
        }
    }

    private readonly doc = inject(DOCUMENT);
    downloadFile() {
        const vm = this.vm();
        const file = vm.file as FileInfo;
        const fileUrl = `${file.path}?access_token=${this.auth.get_token()}`;

        const a = this.doc.createElement("a");
        a.href = fileUrl;
        a.download = vm.fileName;
        a.target = "_blank";
        a.click();

        this.events.emit(new DownloadFileEvent(file));
    }

    // private _displayedColumns = ['thumb', 'name', 'size', 'date', 'commands'];
    // displayedColumns = signal(['thumb', 'name', 'size', 'date', 'commands']);

    convertToVm(file: ViewerExtendedFileVm) {
        const getFileType = (f: FileInfo) => {
            if (!f) return "file";
            const type = f.mimetype;
            if (type) return type.split("/")?.[0].toLocaleLowerCase();
            const name = f.originalname;
            const ext = name?.split(".").pop() ?? "";
            const imageExts = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico", "webp"];
            if (imageExts.includes(ext)) return "image";
            return "file";
        };
        const fileType = getFileType(file.file as FileInfo);
        file["fileType"] = fileType;
        file["fileName"] = file.file["originalname"] ?? file.file["name"];
        file["date"] = file.file["date"] ?? new Date();

        this.applyAction(file as ViewerExtendedFileVm, actions);

        return file as ViewerExtendedFileVm;
    }

    applyAction(file: ViewerExtendedFileVm, actions: ((item: File | FileInfo) => ActionDescriptor)[]) {
        const f = file;
        const acs = actions.map((a) => a(f.file as File | FileInfo));
        f.actions = acs.filter((a: ActionDescriptor) => a.menu !== true);
        f.menuActions = acs.filter((a: ActionDescriptor) => a.menu === true);
    }
    snack = inject(SnackBarService);
    async onMenuAction(ad: ActionDescriptor, item: ViewerExtendedFileVm) {
        if (ad.name === "copy_url") {
            const file = item.file as FileInfo;
            // const at = `?access_token=${this.auth.get_token()}`;
            const fileUrl = `${file.path}`;
            navigator.clipboard.writeText(fileUrl);
            this.snack.openInfo("Url copied to clipboard.");
        }
        if (ad.name === "download") this.downloadFile();
        else if (ad.name === "remove") {
            if (this.stream()) {
                this.stream().cancel();
                this.events.emit(new CancelUploadFileEvent(item.file as File));
            } else {
                if (await this.confirm.open()) this.events.emit(new RemoveFileEvent(item.file as FileInfo));
            }
        }
        // this.action.emit({ action: ad, data: [item.file] });
    }
    private readonly fileUploader = inject(FileUploadService);
    path = input.required<string>();

    uploadingSub: Subscription;
    uploading = signal(false);
    error = signal<{ message: string; error: any }>(undefined);
    stream = signal<UploadStream>(undefined);
    private startUpload(fvm: ViewerExtendedFileVm) {
        const s = this.fileUploader.upload(this.path() as any, fvm.file as File);
        this.stream.set(s);

        const file: File = fvm.file as File;
        this.uploadingSub = s.connection;
        this.uploading.set(true);
        this.events.emit(new UploadFileStartEvent(fvm.file as File, s));
        s.response$.subscribe({
            next: (f) => {
                this.events.emit(new UploadFileSuccessEvent(f, file, s));
                fvm.file = f;
                this.stream.set(undefined);
            },
            error: (e) => {
                const error = { message: e.error.message, error: e };
                fvm.error = error;
                this.error.set(error);
                this.events.emit(new UploadFileErrorEvent(file, error));
                this.stream.set(undefined);
                this.uploading.set(false);
            },
            complete: () => {
                this.events.emit(new UploadFileEndEvent(fvm.file as FileInfo));
                this.uploading.set(false);
                this.stream.set(undefined);
            },
        });
    }

    dialog = inject(DialogService);
    onImageClick() {
        this.dialog.open({ component: ImageViewerComponent, inputs: { path: this.imageSrc() } });
    }
}

@Component({
    selector: "image-viewer",
    standalone: true,
    template: `<div class="image-viewer"><img [src]="path()" alt="" /></div>`,
    styles: [
        `
            .image-viewer {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            img {
                max-width: 100%;
                max-height: 100%;
                border-radius: var(--mat-sys-corner-small);
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
})
export class ImageViewerComponent {
    path = input.required<string>();
}
