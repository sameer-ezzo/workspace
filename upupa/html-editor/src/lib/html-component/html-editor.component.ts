import {
    Component,
    Input,
    forwardRef,
    OnChanges,
    ViewEncapsulation,
    inject,
    signal,
    input,
    afterNextRender,
    model,
    ElementRef,
    AfterViewInit,
    viewChild,
    SimpleChanges,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

import { HtmlUploadAdapter } from '../html-upload-adapter';
import { HTML_EDITOR_CONFIG, HTML_EDITOR_UPLOAD_BASE } from '../di.token';
import { InputBaseComponent, UtilsModule } from '@upupa/common';
import { LanguageService } from '@upupa/language';
import { UploadModule, UploadService } from '@upupa/upload';
import { AuthService } from '@upupa/auth';

import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';
import { ContextConfig, Editor, EditorConfig } from '@ckeditor/ckeditor5-core';
import {
    ClassicEditor,
    Bold,
    Essentials,
    Italic,
    Mention,
    Paragraph,
    Undo,
} from 'ckeditor5';
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
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => HtmlEditorComponent),
            multi: true,
        },
    ],
})
export class HtmlEditorComponent
    extends InputBaseComponent<string>
    implements AfterViewInit
{
    readonly = input(false);
    language = input('');
    dir = input('');

    placeholder = input('');
    label = input('');
    hint = input('');

    config: EditorConfig;

    uploadPath = input('/storage');
    editorConfig = input<EditorConfig>(DecoupledEditor.defaultConfig);
    private readonly upload = inject(UploadService);
    private readonly auth = inject(AuthService);

    editor: Editor;
    el = inject(ElementRef<HTMLElement>);
    editorElement =
        viewChild.required<ElementRef<HTMLTextAreaElement>>('editor');
    async ngAfterViewInit() {
        await this._initEditor();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['value']) {
            this.editor?.setData(this.value() ?? '');
        }
    }
    private async _initEditor() {
        const lang = this.language() ?? 'en';
        this.config = {
            language: { ui: lang, content: lang },
            placeholder: this.placeholder(),
            ...this.editorConfig(),
        };

        if (this.config?.mediaEmbed)
            this.config.mediaEmbed.previewsInData = true;

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
            editor.setData(this.value() ?? '');

            editor.model.document.on('change:data', () => {
                this.onInput(null, editor.getData());
            });
            this.editor = editor;
        } catch (error) {
            console.error(error);
        }
    }

    ngOnDestroy() {
        this.editor?.destroy();
    }
    htmlChanged({ editor }: any) {
        const data = editor.data.get();
        this.value.set(data);
        this._propagateChange();
        this.markAsTouched();
    }

    public uploadAdapterPlugin(editor: any): void {
        const path = this.uploadPath();
        editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
            const adapter = new HtmlUploadAdapter(loader) as any;
            adapter.url = path;
            adapter.auth = this.auth;
            adapter.uploader = this.upload;
            return adapter;
        };
    }
}
