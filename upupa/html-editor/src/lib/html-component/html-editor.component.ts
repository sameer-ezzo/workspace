import { Component, Input, forwardRef, Optional, Inject, OnChanges, ViewEncapsulation, ViewChild, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';


import { HtmlUploadAdapter } from '../html-upload-adapter';
import { HTML_EDITOR_CONFIG, HTML_EDITOR_UPLOAD_BASE } from '../di.token';
import { InputBaseComponent } from '@upupa/common';
import { LanguageService } from '@upupa/language';
import { UploadService } from '@upupa/upload';
import { Editor, EditorConfig } from '@ckeditor/ckeditor5-core';
import { ChangeEvent } from '@ckeditor/ckeditor5-angular/ckeditor.component';
import { AuthService } from '@upupa/auth';

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
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => HtmlEditorComponent), multi: true }
    ]
})
export class HtmlEditorComponent extends InputBaseComponent<string> implements OnChanges {
    public Editor = DecoupledEditor
    @Input() readonly = false;
    @Input() language: string;
    @Input()
    private _placeholder: string;
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


    constructor(
        private ls: LanguageService,
        @Inject(HTML_EDITOR_UPLOAD_BASE) private baseUrl: string,
        @Optional() @Inject(HTML_EDITOR_CONFIG) private editorConfig: EditorConfig,
        private upload: UploadService,
        private readonly auth: AuthService
    ) {
        super();
        if (!this.baseUrl?.trim()) throw `HTML Editor ${this.name} must have baseUrl provided.`
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