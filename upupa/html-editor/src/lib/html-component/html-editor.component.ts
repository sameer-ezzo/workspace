import { Component, Input, forwardRef, OnChanges, ViewEncapsulation, inject, signal } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';


import { HtmlUploadAdapter } from '../html-upload-adapter';
import { HTML_EDITOR_CONFIG, HTML_EDITOR_UPLOAD_BASE } from '../di.token';
import { InputBaseComponent } from '@upupa/common';
import { LanguageService } from '@upupa/language';
import { UploadService } from '@upupa/upload';
import { Editor, EditorConfig } from '@ckeditor/ckeditor5-core';
import { ChangeEvent, CKEditorComponent } from '@ckeditor/ckeditor5-angular/ckeditor.component';
import { AuthService } from '@upupa/auth';
// import { ClassicEditor, Bold, Essentials, Italic, Mention, Paragraph, Undo } from 'ckeditor5';

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

    ready = signal(false);
    watchdog: any;
    @Input() readonly = false;
    @Input() language: string;

    private _placeholder: string;
    @Input()
    get placeholder(): string { return this._placeholder; }
    set placeholder(value: string) {
        this._placeholder = value;
        this.config.placeholder = value;
    }
    @Input() label: string;
    @Input() hint: string;
    @Input() errorMessages: { [errorCode: string]: string } = {};
    @Input() uploadPath!: string
    config: EditorConfig


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
    // private baseUrl = inject(HTML_EDITOR_UPLOAD_BASE)
    private editorConfig = inject(HTML_EDITOR_CONFIG) as EditorConfig
    private upload = inject(UploadService)
    private readonly auth = inject(AuthService)

    watchdogConfig = {
        crashNumberLimit: 5
    }

    async ngOnInit() {
        this.watchdog = new CKSource.ContextWatchdog(CKSource.Context as any);
        try {
            await this.watchdog.create(this.watchdogConfig)
            this.ready.set(true)
            console.log('Watchdog is ready to use!', this.watchdog);

        } catch (error) {
            console.error(error);
        }

        const lang = this.ls.language ?? 'en'
        this.config = {

            language: { ui: lang, content: lang },
            placeholder: this.placeholder,
            ...this.editorConfig
        }
        if (this.config?.mediaEmbed) this.config.mediaEmbed.previewsInData = true;
    }



    htmlChanged({ editor }: ChangeEvent) {
        if(!editor) return;
        const data = editor.data.get();
        if (data === this.value) return;
        this.value = data;
        this.markAsTouched();
        this.control.markAsDirty();
    }


    public onReady(editor: Editor, ckEditor: any): void {
        // this.Editor = editor;

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
            return new HtmlUploadAdapter(loader, this.uploadPath, this.upload, this.auth) as any;
        }

        if (this.config?.mediaEmbed) this.config.mediaEmbed.previewsInData = true
    }
}