import { HttpClient } from "@angular/common/http";
import { Component, forwardRef, inject, model, computed, effect } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "@upupa/auth";
import { EventBus } from "@upupa/common";
import { DataAdapter, DataService, ApiDataSource } from "@upupa/data";
import { FileInfo } from "@upupa/upload";
import { BehaviorSubject, Subscription } from "rxjs";
import { FileSelectComponent } from "../file-select/file-select.component";
import { SnackBarService } from "@upupa/dialog";

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
})
export class FileBrowserComponent {
    public auth = inject(AuthService);
    public http = inject(HttpClient);
    public data = inject(DataService);
    public route = inject(ActivatedRoute);
    public snack = inject(SnackBarService);
    public bus = inject(EventBus);
    normalizedChangeSub: Subscription | undefined;

    files = [];
    view = model<"list" | "grid">("list");

    focused = undefined as FileInfo | undefined;

    path = model("/");
    segments = computed(() => (this.path() ?? "").split("/"));

    dataSource = new ApiDataSource<FileInfo>(this.data, "/storage", valueProperty);
    adapter = new DataAdapter<FileInfo>(this.dataSource, "_id", undefined, valueProperty, undefined, {
        filter: {
            destination: ["storage", this.path()].join("/"),
        },
        terms: [
            { field: "originalname" as keyof FileInfo, type: "like" },
            { field: "fieldname" as keyof FileInfo, type: "like" },
        ],
        page: { pageSize: 50 },
    });

    files$ = new BehaviorSubject<FileInfo[]>([]);
    value = model<FileInfo[]>([]);
    disabled = model(false);

    constructor() {
        effect(() => {
            this.normalizedChangeSub?.unsubscribe();
            const _path = this.path() ?? "/";
            const filter = { destination: `storage${_path == "/" ? "" : _path}*` };
            this.adapter.filter = filter;
            this.normalizedChangeSub = this.adapter.normalized$.subscribe((f) => this.files$.next(f.map((c) => c.item)));
            this.adapter.refresh();
        });
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
