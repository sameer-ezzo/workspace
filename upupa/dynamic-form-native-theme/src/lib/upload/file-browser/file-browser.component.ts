import { HttpClient } from '@angular/common/http';
import { Component, Input, forwardRef, OnInit, Injector, signal, inject } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@upupa/auth';
import { SnackBarService, EventBus } from '@upupa/common';
import { DataAdapter, DataService, ServerDataSource } from '@upupa/data';
import { LanguageService } from '@upupa/language';
import { FileInfo } from '@upupa/upload';
import { BehaviorSubject } from 'rxjs';
import { FileSelectComponent } from '../file-select/file-select.component';
import { DataComponentBase } from '@upupa/table';


@Component({
    selector: 'file-browser',
    templateUrl: './file-browser.component.html',
    styleUrls: ['./file-browser.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => FileBrowserComponent),
            multi: true,
        },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => FileBrowserComponent), multi: true }
    ]
})
export class FileBrowserComponent extends DataComponentBase<FileInfo> implements OnInit {

    private readonly data = inject(DataService)
    public injector = inject(Injector)
    public auth = inject(AuthService)
    public http = inject(HttpClient)
    public languageService = inject(LanguageService)
    public ds = inject(DataService)
    public route = inject(ActivatedRoute)
    public snack = inject(SnackBarService)
    public bus = inject(EventBus)
    constructor() {
        super();

    }

    view = signal<'list' | 'grid'>('list')
    files = []
    focused = undefined as FileInfo | undefined



    keyProperty = '_id' as keyof FileInfo;
    valueProperty = ['_id', 'fieldname', 'originalname', 'filename', 'size', 'encoding', 'mimetype', 'destination', 'path', 'date', 'status', 'user', 'meta'] as (keyof FileInfo)[]

    override adapter = new DataAdapter<FileInfo>(
        new ServerDataSource(this.data, '/v2/storage', this.valueProperty),
        this.keyProperty,
        undefined,
        this.valueProperty,
        undefined,
        {
            terms: [
                { field: 'originalname' as keyof FileInfo, type: 'like' },
                { field: 'fillename' as keyof FileInfo, type: 'like' }
            ],
            page: { pageSize: 50 }
        })
    files$ = new BehaviorSubject<FileInfo[]>([])
    private _path = undefined as string | undefined;
    @Input()
    public get path() {
        return this._path;
    }
    public set path(value) {
        if (this._path === value) return;
        this._path = value;

        const filter = (value && value !== '/') ? {
            destination: ['storage', this.path.split('/')].filter(v => v).join('/')
        } : undefined

        this.adapter.filter = filter
        this.adapter.refresh()
    }
    
    
    
    override ngOnInit(): void {
        super.ngOnInit()
        if (!this.path) throw new Error("Base path is not provided");
        this.adapter.normalized$.subscribe(f => this.files$.next(f.map(c => c.item)))
    }

    selectFile(fileSelect: FileSelectComponent) {
        fileSelect.selectFile()
    }
}