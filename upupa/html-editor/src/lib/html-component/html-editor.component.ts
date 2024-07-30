import { Component, Input, forwardRef, OnChanges, ViewEncapsulation, inject, signal, ViewChild } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
// import { Bold, Essentials, Italic, Mention, Paragraph, Undo } from '@ckeditor/ckeditor5-build-decoupled-document';


import { HtmlUploadAdapter } from '../html-upload-adapter';
import { HTML_EDITOR_CONFIG, HTML_EDITOR_UPLOAD_BASE } from '../di.token';
import { InputBaseComponent } from '@upupa/common';
import { LanguageService } from '@upupa/language';
import { UploadService } from '@upupa/upload';
import { Editor, EditorConfig } from '@ckeditor/ckeditor5-core';
import { ChangeEvent, CKEditorComponent } from '@ckeditor/ckeditor5-angular/ckeditor.component';
import { AuthService } from '@upupa/auth';

import CKSource from '@ckeditor/ckeditor5-build-decoupled-document';
const ContextWatchdog = CKSource.ContextWatchdog;
const Context = CKSource.Context;


// https://ckeditor.com/docs/ckeditor5/latest/installation/integrations/angular.html
@Component({
    selector: 'form-html',
    templateUrl: './html-editor.component.html',
    styleUrls: ['./html-editor.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => HtmlEditorComponent),
            multi: true,
        },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => HtmlEditorComponent), multi: true },
    ]
})
export class HtmlEditorComponent extends InputBaseComponent<string> implements OnChanges {

    public Editor = DecoupledEditor;
    // @ViewChild('ckEditor') editorComponent: CKEditorComponent;
    // public getEditor() {
    //     return this.editorComponent?.editorInstance;
    // }
    watchdog: any;
    @Input() readonly = false;
    @Input() language: string;
    @Input()
    private _placeholder: string;
    ready = signal(false);
    public get placeholder(): string {
        return this._placeholder;
    }
    public set placeholder(value: string) {
        this._placeholder = value;
        this.config.placeholder = value;
    }
    @Input() label: string;
    @Input() hint: string;
    @Input() errorMessages: { [errorCode: string]: string } = {};
    @Input() uploadPath!: string
    config: EditorConfig
    editor: any;

    initialized = false
    override _updateViewModel(): void {
        if (!this.initialized) {
            this.model.data = this.value
            this.initialized = true
        }
    }

    model = {
        data: ''
    }



    markAsTouched() {
        this.control?.markAsTouched();
    }

    private ls = inject(LanguageService)
    private baseUrl = inject(HTML_EDITOR_UPLOAD_BASE)
    private editorConfig = inject(HTML_EDITOR_CONFIG) as EditorConfig
    private upload = inject(UploadService)
    private readonly auth = inject(AuthService)

    watchdogConfig = {
        crashNumberLimit: 5
    }

    async ngOnInit() {
        if (!this.baseUrl?.trim()) throw `HTML Editor ${this.name} must have baseUrl provided.`


        this.watchdog = new CKSource.ContextWatchdog(CKSource.Context as any);
        try {
            await this.watchdog.create(this.watchdogConfig)
            this.ready.set(true)
        } catch (error) {
            console.error(error);
        }

        const lang = this.ls.language ?? 'en'
        this.config = {
            ...(this.editor?.config || {}),
            language: { ui: lang, content: lang },
            placeholder: this.placeholder,
            ...this.editorConfig
        }
        if (this.config?.mediaEmbed) this.config.mediaEmbed.previewsInData = true;
    }



    htmlChanged({ editor }: ChangeEvent) {
        const data = editor.data.get();
        if (data === this.value) return;
        this.value = data;
        this.markAsTouched();
        this.control.markAsDirty();
    }


    public onReady(editor: Editor, ckEditor: any): void {
        this.editor = editor;
        const element = editor.ui.getEditableElement()!;
        const parent = element.parentElement!;

        parent.insertBefore(
            editor.ui.view['toolbar'].element!,
            element
        );

        // editor.ui.view.editable.element.parentElement.insertBefore(
        //     editor.ui.view.toolbar.element,
        //     editor.ui.view.editable.element
        // )

        (editor.plugins.get('FileRepository') as any).createUploadAdapter = (loader) => {

            const path = `${this.baseUrl}/${this.uploadPath}`
                .split('/')
                .map(x => x.trim())
                .filter(x => x.length > 0)
                .join('/');
            return new HtmlUploadAdapter(loader, path, this.upload, this.auth) as any //UploadAdapter;
        }

        if (this.config?.mediaEmbed) this.config.mediaEmbed.previewsInData = true
    }
}