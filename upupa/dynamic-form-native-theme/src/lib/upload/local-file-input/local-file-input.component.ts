import { Component, forwardRef, OnChanges, SimpleChanges, input, inject, DestroyRef } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { ThemePalette } from "@angular/material/core";
import { DataService } from "@upupa/data";
import { InputBaseComponent } from "@upupa/common";

import { AuthService } from "@upupa/auth";
import { ClipboardService, openFileDialog } from "@upupa/upload";
import { DialogService } from "@upupa/dialog";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DOCUMENT } from "@angular/common";

@Component({
    selector: "local-file-input",
    templateUrl: "./local-file-input.component.html",
    styleUrls: ["./local-file-input.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LocalFileInputComponent),
            multi: true,
        },
    ],
})
export class LocalFileInputComponent extends InputBaseComponent implements OnChanges {
    color = input<ThemePalette>("accent");
    dateFormat = input("dd MMM yyyy");
    placeholder = input("");
    label = input("");
    hint = input("");
    readonly = input(false);

    minAllowedFiles = input(0);
    maxAllowedFiles = input(1);
    minSize = input(0);
    maxSize = input(1024 * 1024 * 10); //10 MB
    accept = input("*.*");

    includeAccess = input(false);

    destroyRef = inject(DestroyRef);

    uploading = false;
    uploadingProgress: number | null = null;
    access_token = null;

    constructor(public data: DataService, private auth: AuthService, public clipboard: ClipboardService, public dialog: DialogService) {
        super();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.includeAccess() === true) {
            this.auth.token$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((t) => this.access_token.set(`?access_token=${t}`));
        }
    }

    private validateFileExtensions(file: File, accepts: string) {
        if (file && accepts) {
            const segments = file.name.split(".");
            segments.shift();
            const fileExtension = segments.join(".").toLowerCase();
            const extensions = accepts
                .split(",")
                .filter((x) => x != "*.*")
                .map((x) => (x.startsWith(".") ? x.substring(1).toLowerCase() : x.toLowerCase()));
            return extensions.some((x) => x === fileExtension || x === file.type) ? null : { extension: fileExtension };
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

    private readonly doc = inject(DOCUMENT);
    async selectFile() {
        const files = await openFileDialog(this.doc, this.accept(), this.maxAllowedFiles() !== 1);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const extensionErrors = this.validateFileExtensions(file, this.accept());

            const maxSizeErrors = this.validateFileMaxSize(file, this.maxSize());
            const minSizeErrors = this.validateFileMinSize(file, this.minSize());

            if (extensionErrors?.extension?.length > 0 || maxSizeErrors || minSizeErrors) {
                const errors = Object.assign({}, extensionErrors, maxSizeErrors, minSizeErrors);
                //this.control().errors = errors
                this.markAsTouched();
                continue;
            }
        }

        if (Object.keys(this.control().errors ?? {}).length === 0) {
            if (this.maxAllowedFiles() > 1) this.value.set(Array.from(files));
            else this.value.set(files.item(0));
        }
    }

    removeFile(file: File) {
        const v = this.value();
        if (Array.isArray(v)) {
            const i = v.indexOf(file);
            v.splice(i, 1);
            this.value.set(v);
        } else this.value.set(null);
    }
}
