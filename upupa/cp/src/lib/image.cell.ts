import { NgOptimizedImage } from "@angular/common";
import { Component, inject, input } from "@angular/core";
import { FileInfo } from "@noah-ark/common";
import { DialogService } from "@upupa/dialog";
import { BaseUrlPipe } from "./base-url.pipe";
import { UploadClient } from "@upupa/upload";
import { ImageViewerComponent } from "@upupa/dynamic-form-material-theme";

@Component({
    standalone: true,
    // imports: [NgStyle],
    styles: `
        .cell-image {
            --duration: 0.3s;
            --ease: cubic-bezier(0.4, 0, 0.2, 1);
            object-fit: cover;
            display: block;
            transition:
                scale var(--duration) var(--ease),
                translate var(--duration) var(--ease);
            --offset-px: calc(var(--offset) * 1px);
            margin-inline-start: var(--offset-px, 0);
        }
        .cell-image:first-child {
            margin-inline-start: 0;
        }
        .cell-image:hover {
            z-index: 999;
            scale: 1.2;
        }
        .cell-image:hover ~ * {
            translate: 20px;
        }

        :host:has(.cell-image:hover) {
            overflow: visible;
            .cell-image:not(:hover) {
                filter: brightness(1.2) grayscale(0.9);
                opacity: 0.8;
                scale: 0.9;
            }
        }

        .can-open-dialog {
            cursor: pointer;
        }
    `,
    template: `
        <div style="display: flex; gap: -20px">
            @for (file of value(); track file.path) {
                <img
                    [ngSrc]="file.path | baseUrl"
                    class="cell-image"
                    [class.can-open-dialog]="canOpenImageDialog()"
                    (click)="openImageDialog(file)"
                    [width]="width()"
                    [height]="height()"
                    [style]="{ '--offset': width() / -2 }"
                />
            }
        </div>
    `,
    imports: [NgOptimizedImage, BaseUrlPipe],
})
export class ImageCellTemplate {
    upload = inject(UploadClient);
    dialog = inject(DialogService);

    value = input<FileInfo[], FileInfo[]>([], {
        transform: (files) =>
            files.map((f) => {
                const file: FileInfo = { ...f };
                if (f.path) file.path = f.path.startsWith("http") ? f.path : `${this.upload.baseOrigin}${f.path}`;
                return file;
            }),
    });

    width = input(48);
    height = input(48);

    canOpenImageDialog = input(false);

    openImageDialog(file: FileInfo) {
        if (this.canOpenImageDialog()) {
            this.dialog.open({ component: ImageViewerComponent, inputs: { path: file.path } });
        }
    }
}
