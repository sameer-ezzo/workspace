import { HttpClient } from '@angular/common/http';
import { Component, Input, forwardRef, OnInit, Injector, signal, inject, model, SimpleChanges, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@upupa/auth';
import { EventBus } from '@upupa/common';
import { DataAdapter, DataService, ApiDataSource } from '@upupa/data';
import { LanguageService } from '@upupa/language';
import { FileInfo } from '@upupa/upload';
import { BehaviorSubject, Subscription } from 'rxjs';
import { FileSelectComponent } from '../file-select/file-select.component';
import { ValueDataComponentBase } from '@upupa/table';
import { SnackBarService } from '@upupa/dialog';

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
    ],
})
export class FileBrowserComponent extends ValueDataComponentBase<FileInfo> {
    private readonly data = inject(DataService);
    public auth = inject(AuthService);
    public http = inject(HttpClient);
    public languageService = inject(LanguageService);
    public ds = inject(DataService);
    public route = inject(ActivatedRoute);
    public snack = inject(SnackBarService);
    public bus = inject(EventBus);
    normalizedChangeSub: Subscription | undefined;

    files = [];
    view = signal<'list' | 'grid'>('list');
    focused = undefined as FileInfo | undefined;

    keyProperty = '_id' as keyof FileInfo;
    valueProperty = ['_id', 'fieldname', 'originalname', 'filename', 'size', 'encoding', 'mimetype', 'destination', 'path', 'date', 'status', 'user', 'meta'] as (keyof FileInfo)[];

    path = input.required<string, string>({
        transform: (v) =>
            v
                .replace(/\/$/, '')
                .split('/')
                .filter((v) => v)
                .join('/'),
    });
    override adapter = model(
        new DataAdapter<FileInfo>(new ApiDataSource(this.data, '/storage', this.valueProperty), this.keyProperty, undefined, this.valueProperty, undefined, {
            filter: {
                destination: ['storage', this.path()].join('/'),
            },
            terms: [
                { field: 'originalname' as keyof FileInfo, type: 'like' },
                { field: 'fieldname' as keyof FileInfo, type: 'like' },
            ],
            page: { pageSize: 50 },
        }),
    );
    files$ = new BehaviorSubject<FileInfo[]>([]);

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        super.ngOnChanges(changes);
        if (changes['path']) {
            this.normalizedChangeSub?.unsubscribe();
            const filter = {
                destination: ['storage', this.path().split('/')].filter((v) => v).join('/'),
            };
            this.adapter().filter = filter;
            this.normalizedChangeSub = this.adapter().normalized$.subscribe((f) => this.files$.next(f.map((c) => c.item)));
            this.adapter().refresh();
        }
    }

    selectFile(fileSelect: FileSelectComponent) {
        fileSelect.selectFile();
    }
}
