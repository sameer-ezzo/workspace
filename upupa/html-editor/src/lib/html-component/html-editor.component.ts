import { Component, forwardRef, ViewEncapsulation, inject, input, ElementRef, viewChild, SimpleChanges, effect, HostListener, PLATFORM_ID, InjectionToken } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";

import { HtmlUploadAdapter } from "../html-upload-adapter";
import { ErrorsDirective, InputBaseComponent, UtilsModule } from "@upupa/common";
import { UploadClient, UploadModule } from "@upupa/upload";
import { AuthService } from "@upupa/auth";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";

// import { ClassicEditor,  } from 'ckeditor5';

declare type DecoupledEditor = any;
declare type EditorConfig = any;

// https://ckeditor.com/docs/ckeditor5/latest/installation/integrations/angular.html
@Component({
    selector: "form-html",
    templateUrl: "./html-editor.component.html",
    styleUrls: ["./html-editor.component.scss"],
    imports: [CommonModule, UtilsModule, MatFormFieldModule, UploadModule, ErrorsDirective],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => HtmlEditorComponent),
            multi: true,
        },
    ]
})
export class HtmlEditorComponent extends InputBaseComponent<string> {
    readonly = input(false);
    language = input("");
    dir = input("");
    licenseKey = input("GPL", { transform: (x: string) => (x || "GPL").toUpperCase() });
    placeholder = input("");
    label = input("");
    hint = input("");
    mode = input<"classic" | "document">("document");

    config: EditorConfig;

    uploadPath = input("/html-editor-assets");
    editorConfig = input<EditorConfig>(null);
    private readonly uploadClient = inject(UploadClient);
    private readonly auth = inject(AuthService);

    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    editor: DecoupledEditor;
    el = inject(ElementRef<HTMLElement>);
    editorElement = viewChild<ElementRef<HTMLTextAreaElement>>("editor");

    async ngAfterViewInit() {
        if (!this.isBrowser) return;

        const el = this.editorElement();
        if (!el) return;
        await this._initEditor();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["value"]) {
            // this.editor?.setData(this.value() ?? "");
            this.control().setValue(this.value());
        }
    }

    @HostListener("blur")
    onBlur(): void {
        this.markAsTouched();
    }
    private async _initEditor() {
        const DecoupledEditor = await import("@ckeditor/ckeditor5-build-decoupled-document").then((x) => x.default);
        // const EditorCore = await import("@ckeditor/ckeditor5-core");

        const lang = this.language() ?? "en";
        this.config = {
            licenseKey: "GPL",
            language: { ui: lang, content: lang },
            placeholder: this.placeholder(),
            ...DecoupledEditor.defaultConfig,
            ...(this.editorConfig() ?? {}),
        };

        if (this.config?.mediaEmbed) this.config.mediaEmbed.previewsInData = true;

        try {
            const editorEl = this.editorElement().nativeElement;
            const editor = await DecoupledEditor.create(editorEl, { ...(this.config as any) });
            const toolbar = editor.ui.view.toolbar.element;
            const parent = editorEl.parentElement as HTMLElement;
            const editableElement = editor.ui.getEditableElement()!;
            parent.appendChild(toolbar);
            parent.appendChild(editableElement);
            this.uploadAdapterPlugin(editor);
            editor.setData(this.value() ?? "");

            editor.model.document.on("change:data", () => {
                this.handleUserInput(editor.getData());
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
        editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
            const adapter = new HtmlUploadAdapter(loader, path, this.uploadClient, this.auth);
            return adapter;
        };
    }
}
