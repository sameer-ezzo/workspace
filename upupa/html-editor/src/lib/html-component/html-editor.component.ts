import { Component, forwardRef, ViewEncapsulation, inject, input, ElementRef, AfterViewInit, viewChild, SimpleChanges, effect, HostListener } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { HtmlUploadAdapter } from '../html-upload-adapter';
import { InputBaseComponent, UtilsModule } from '@upupa/common';
import { UploadClient, UploadModule, UploadService } from '@upupa/upload';
import { AuthService } from '@upupa/auth';

import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { Editor, EditorConfig } from '@ckeditor/ckeditor5-core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';

// https://ckeditor.com/docs/ckeditor5/latest/installation/integrations/angular.html
@Component({
    selector: 'form-html',
    templateUrl: './html-editor.component.html',
    styleUrls: ['./html-editor.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, UtilsModule, MatFormFieldModule, UploadModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => HtmlEditorComponent),
            multi: true,
        },
    ],
})
export class HtmlEditorComponent extends InputBaseComponent<string> {
    readonly = input(false);
    language = input('');
    dir = input('');

    placeholder = input('');
    label = input('');
    hint = input('');

    config: EditorConfig;

    uploadPath = input('/html-editor-assets');
    editorConfig = input<EditorConfig>(DecoupledEditor.defaultConfig);
    private readonly uploadClient = inject(UploadClient);
    private readonly auth = inject(AuthService);

    editor: Editor;
    el = inject(ElementRef<HTMLElement>);
    editorElement = viewChild.required<ElementRef<HTMLTextAreaElement>>('editor');
    constructor() {
        super();
        effect(async () => {
            const el = this.editorElement();
            if (!el) return;
            await this._initEditor();
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['value']) {
            this.editor?.setData(this.value() ?? '');
        }
    }

    @HostListener('blur')
    onBlur(): void {
        this.markAsTouched();
    }
    private async _initEditor() {
        const lang = this.language() ?? 'en';
        this.config = {
            language: { ui: lang, content: lang },
            placeholder: this.placeholder(),
            ...this.editorConfig(),
        };

        if (this.config?.mediaEmbed) this.config.mediaEmbed.previewsInData = true;

        try {
            const editorEl = this.editorElement().nativeElement;
            const editor = await DecoupledEditor.create(editorEl, {
                ...this.config,
            });

            const toolbar = editor.ui.view.toolbar.element;
            const parent = editorEl.parentElement as HTMLElement;
            const editableElement = editor.ui.getEditableElement()!;
            parent.appendChild(toolbar);
            parent.appendChild(editableElement);
            this.uploadAdapterPlugin(editor);
            editor.setData(this.control().value ?? '');

            editor.model.document.on('change:data', () => {
                this.control().setValue(editor.getData());
            });
            this.editor = editor;
        } catch (error) {
            console.error(error);
        }
    }

    ngOnDestroy() {
        this.editor?.destroy();
    }

    public uploadAdapterPlugin(editor: any): void {
        const path = this.uploadPath();
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            const adapter = new HtmlUploadAdapter(loader, path, this.uploadClient, this.auth);
            return adapter;
        };
    }
}
