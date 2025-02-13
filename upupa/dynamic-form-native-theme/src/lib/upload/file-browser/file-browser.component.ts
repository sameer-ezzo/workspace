import { HttpClient } from "@angular/common/http";
import { Component, forwardRef, inject, model, computed, effect, SimpleChanges } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "@upupa/auth";
import { DataAdapter, DataService, ApiDataSource } from "@upupa/data";
import { FileInfo } from "@upupa/upload";
import { FileSelectComponent } from "../file-select/file-select.component";
import { SnackBarService } from "@upupa/dialog";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatButtonModule } from "@angular/material/button";
import { FileEvent } from "../viewer-file.vm";
import { FileUploadService } from "../file-upload.service";

const valueProperty = [
    "_id",
    "fieldname",
    "originalname",
    "filename",
    "size",
    "encoding",
    "mimetype",
    "destination",
    "path",
    "date",
    "status",
    "user",
    "meta",
] as (keyof FileInfo)[];

@Component({
    standalone: true,
    selector: "file-browser",
    templateUrl: "./file-browser.component.html",
    styleUrls: ["./file-browser.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileBrowserComponent),
            multi: true,
        },
    ],
    imports: [FileSelectComponent, MatPaginatorModule, MatSidenavModule, MatToolbarModule, MatIconModule,MatButtonModule, MatButtonToggleModule],
})
export class FileBrowserComponent {
    public auth = inject(AuthService);
    public http = inject(HttpClient);
    public data = inject(DataService);
    public route = inject(ActivatedRoute);
    public snack = inject(SnackBarService);

    path = model("/");
    view = model<"list" | "grid">("grid");

    focused = model<FileInfo | undefined>(undefined);

    segments = computed(() => (this.path() ?? "").split("/"));

    dataSource = new ApiDataSource<FileInfo>(this.data, `/storage?select=${valueProperty.join(",")}`);
    adapter = new DataAdapter<FileInfo>(this.dataSource, "_id", undefined, valueProperty, undefined, {
        filter: {
            destination: `storage${this.path() == "/" ? "" : this.path()}*`,
        },
        terms: [
            { field: "originalname" as keyof FileInfo, type: "like" },
            { field: "fieldname" as keyof FileInfo, type: "like" },
        ],
        page: { pageSize: 50 },
    });
    files = computed(() => this.adapter.normalized().map((x) => x.item));

    value = model<FileInfo[]>([]);
    disabled = model(false);

    maxAllowedFiles = Number.MAX_SAFE_INTEGER;
    public fileUploader = inject(FileUploadService);

    async onFileEvent(event: FileEvent) {
        if (event.name === "remove") {
            if('path' in event.file) {
                try{
                    await this.fileUploader.uploadClient.delete(event.file.path);
                }
                catch(e){
                    if(e.status !== 404) throw e

                }
            }
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['path']) {
            const _path = this.path() ?? "/";
            const filter = { destination: `storage${_path == "/" ? "" : _path}*` };
            this.adapter.load({ filter });
        }

    }

    selectFile(fileSelect: FileSelectComponent) {
        fileSelect.selectFile();
    }

    // >>>>> ControlValueAccessor ----------------------------------------
    _onChange: (value: FileInfo[]) => void;
    _onTouch: () => void;

    propagateChange() {
        this._onChange?.(this.value()); //ngModel/ngControl notify (value accessor)
    }

    markAsTouched() {
        if (this._onTouch) this._onTouch();
    }

    writeValue(v: FileInfo[]): void {
        this.value.set(v);
        this.adapter.getItems(this.adapter.getKeysFromValue(v));
    }

    registerOnChange(fn: (value: FileInfo[]) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }
}
