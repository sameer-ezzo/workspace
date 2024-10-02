import { Component, Input, Output, EventEmitter, forwardRef, ElementRef, SimpleChanges, OnChanges } from '@angular/core'
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms'
import { BreakpointObserver } from '@angular/cdk/layout'
import { FileInfo } from '@upupa/upload'
import { ActionDescriptor } from '@upupa/common'
import { FileUploadService } from '../file-upload.service'
import { Subject } from 'rxjs'
import { SelectionModel } from '@angular/cdk/collections'
import { FileEvent, SelectInputFileVm, ViewerExtendedFileVm } from '../viewer-file.vm'

@Component({
    selector: 'file-viewer',
    templateUrl: './file-viewer.component.html',
    styleUrls: ['./file-viewer.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FilesViewerComponent), multi: true, },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => FilesViewerComponent), multi: true }
    ]
})
export class FilesViewerComponent implements OnChanges {

    hasMore = true

    private _focused: SelectInputFileVm
    public get focused(): SelectInputFileVm {
        return this._focused
    }
    public set focused(value: SelectInputFileVm) {
        this._focused = value
        this.event.emit({ name: 'focused', files: [value] })
    }
    dragging = false
    @Input() dateFormat = 'dd MMM yyyy'

    @Input() includeAccess = false
    @Input() errorMessages = {}
    @Input() base = ''
    @Input() path = ''
    @Input() readOnly = false

    imageResizeOptions = ''

    imageDim = 220
    private _view: 'grid' | 'list' = 'list'
    @Input()
    public get view(): 'grid' | 'list' {
        return this._view
    }
    public set view(value: 'grid' | 'list') {
        this._view = value
        this.imageDim = value === 'grid' ? 220 : 65
    }


    @Input() selectable = false
    @Input() files: SelectInputFileVm[] = []
    destroy$ = new Subject<any>()


    @Output() changed = new EventEmitter()
    @Output() action = new EventEmitter()

    @Input()
    actions: ActionDescriptor[] | ((item: FileInfo) => ActionDescriptor[]) = [];


    private _displayedColumns = ['thumb', 'name', 'size', 'date', 'commands']
    displayedColumns = ['thumb', 'name', 'size', 'date', 'commands']

    viewModel: ViewerExtendedFileVm[] = []

    @Output() event = new EventEmitter<FileEvent>()
    @Input() canUpload = true


    selectionModel = new SelectionModel<string>(true, [], true)

    constructor(protected host: ElementRef<HTMLElement>,
        public fileUploader: FileUploadService,
        protected breakpointObserver: BreakpointObserver) {
    }
    fileId(index, item) { return item.id }


    async ngOnChanges(changes: SimpleChanges): Promise<void> {

        const getFileType = (f: any) => (f ? (f.mimetype ?? f.type)?.split('/')?.[0] ?? 'file' : 'file').toLowerCase()
        const fileToVm = (f: SelectInputFileVm, actions: ActionDescriptor[]) => {
            const fileType = getFileType(f.file)
            return {
                ...f,
                error: !f.error ? null : Object.keys(f.error).map(k => `${k}=${f.error[k]}`).join('\n'),
                fileType,
                actions: actions.filter((a: ActionDescriptor) => a.menu !== true),
                menuActions: actions.filter((a: ActionDescriptor) => a.menu === true),
            }
        }

        if (changes['actions'] || changes['files']) {
            this.viewModel = []
            if (this.files && this.actions) {
                if (Array.isArray(this.actions)) {
                    this.files.forEach(f => this.viewModel.push(fileToVm(f, this.actions as ActionDescriptor[])))
                }
                else if (typeof this.actions === 'function') {
                    this.files.forEach(f => {
                        const actions = (<any>this.actions)(f)
                        this.viewModel.push(fileToVm(f, actions))
                    })
                }
                else {
                    this.files.forEach(f => this.viewModel.push(fileToVm(f, [])))
                }
            }
        }

    }

    cancelUploadTask(file: ViewerExtendedFileVm) {
        if (file.uploadTask.connection) file.uploadTask.cancel()
        this.event.emit({ name: 'canceled', files: [file] })
    }

    removeUploadTask(file: ViewerExtendedFileVm) {
        this.cancelUploadTask(file)
        this.viewModel = this.viewModel.filter(f => f !== file)
        this.event.emit({ name: 'removed', files: [file] })
    }

    onMenuAction(action: ActionDescriptor, item: ViewerExtendedFileVm) {
        this.action.emit({ action, data: [item.file] })
    }

    loadMore() {
        // this.adapter
    }
}