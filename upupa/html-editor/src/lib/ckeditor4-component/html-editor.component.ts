import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, ElementRef, forwardRef, HostListener, inject, input, PLATFORM_ID, SimpleChanges, viewChild } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AuthService } from "@upupa/auth";
import { UtilsModule, ErrorsDirective, InputBaseComponent } from "@upupa/common";
import { UploadModule, UploadClient, UploadService } from "@upupa/upload";

declare var CKEDITOR: any;

export const FULL_TOOLBAR = [
    ["Source", "Save", "NewPage", "DocProps", "Preview", "Print", "Templates", "document"],
    ["Cut", "Copy", "Paste", "PasteText", "PasteFromWord", "Undo", "Redo"],
    ["Find", "Replace", "SelectAll", "Scayt"],
    ["Form", "Checkbox", "Radio", "TextField", "Textarea", "Select", "Button", "ImageButton", "HiddenField"],
    ["Bold", "Italic", "Underline", "Strike", "Subscript", "Superscript", "RemoveFormat"],
    ["NumberedList", "BulletedList", "Outdent", "Indent", "Blockquote", "CreateDiv", "JustifyLeft", "JustifyCenter", "JustifyRight", "JustifyBlock", "BidiLtr", "BidiRtl"],
    ["Link", "Unlink", "Anchor"],
    ["CreatePlaceholder", "Image", "Flash", "Table", "HorizontalRule", "Smiley", "SpecialChar", "PageBreak", "Iframe", "InsertPre"],
    ["Styles", "Format", "Font", "FontSize"],
    ["TextColor", "BGColor"],
    ["UIColor", "Maximize", "ShowBlocks"],
    ["button1", "button2", "button3", "oembed", "MediaEmbed"],
    ["About"],
];

export const SMART_TOOLBAR = [
    ["Format", "Font", "FontSize"],
    ["TextColor", "BGColor"],
    ["Bold", "Italic", "Underline", "Strike", "Subscript", "Superscript", "RemoveFormat"],
    ["NumberedList", "BulletedList", "Outdent", "Indent", "Blockquote"],
    ["JustifyLeft", "JustifyCenter", "JustifyRight", "JustifyBlock", "BidiLtr", "BidiRtl"],
    ["Link", "Unlink"],
    ["Image", "Upload", "Table", "HorizontalRule", "SpecialChar"],
    ["Source", "Iframe", "Embed", "MediaEmbed"],
    ["Maximize"],
];

@Component({
    selector: "form-html",
    templateUrl: "./html-editor.component.html",
    styleUrls: ["./html-editor.component.scss"],

    standalone: true,
    imports: [CommonModule, UtilsModule, MatFormFieldModule, UploadModule, ErrorsDirective],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CKEditor4Component),
            multi: true,
        },
    ],
})
export class CKEditor4Component extends InputBaseComponent<string> {
    private static isScriptLoaded: Record<string, boolean> = {};
    private static loadPromise: Record<string, Promise<void> | null> = {};
    editorElement = viewChild<ElementRef<HTMLTextAreaElement>>("editor");
    config = input<any>({});
    uploadPath = input("/html-editor-assets");

    readonly = input(false);
    language = input("");
    dir = input("");
    placeholder = input("");
    label = input("");
    hint = input("");
    upload = inject(UploadClient);
    auth = inject(AuthService);

    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    private editor: any;

    async ngAfterViewInit() {
        if (!this.isBrowser) return;
        await this.loadEditor();
    }

    private async loadEditor(): Promise<void> {
        if (typeof CKEDITOR === "undefined") await CKEditor4Component.loadScript("/ckeditor/ckeditor.js?v=0.0.1");

        const config = {
            licenseKey: "GPL",
            versionCheck: false,
            uiColor: "#fff7f9",
            toolbar: SMART_TOOLBAR,
            extraPlugins: "image2",
            uploadUrl: `${this.upload.baseUrl}/${this.uploadPath()}`,
            filebrowserUploadUrl: `${this.upload.baseUrl}/${this.uploadPath()}`,
            filebrowserImageUploadUrl: `${this.upload.baseUrl}/${this.uploadPath()}`,
            // filebrowserBrowseUrl: this.uploadPath(),
            //filebrowserImageBrowseUrl,
            image2_alignClasses: ["image-left", "image-center", "image-right"],
            image2_captionedClass: "image-captioned",
            // https://ckeditor.com/docs/ckeditor4/latest/guide/dev_allowed_content_rules.html
            extraAllowedContent: "*[style,id](*);",


            ...this.config(),
        };
        this.editor = CKEDITOR.replace(this.editorElement().nativeElement, config);
        this.editor.setData(this.value());

        // Handle editor changes
        this.editor.on("change", () => {
            const value = this.editor.getData();
            this.handleUserInput(value);
        });

        this.editor.on("fileUploadRequest", (evt) => {
            const xhr = evt.data.fileLoader.xhr;
            xhr.setRequestHeader("Authorization", "Bearer " + this.auth.get_token());
        });

        this.editor.on("fileUploadResponse", (evt) => {
            // Prevent the default response handler.
            evt.stop();

            const data = evt.data;
            try {
                const xhr = data.fileLoader.xhr;
                const status = `${xhr.status}`;
                const response = JSON.parse(data.fileLoader.xhr.responseText);

                if (response?.error || !response?.length || !status?.startsWith("20")) {
                    data.message = "Upload failed";
                    evt.cancel();
                } else {
                    const f = response[0];
                    data.fileName = f.originalname;
                    data.url = `${this.upload.baseOrigin}${f.path}`;
                    data.uploaded = 1;
                }
            } catch (e) {
                data.message = "Upload failed";
                evt.cancel();
            }
        });

        // this.uploadAdapterPlugin(this.editor);
        // this.modifyImageUploadDialog();
    }

    // private modifyImageUploadDialog() {
    // this.editor.on("dialogDefinition", (ev) => {
    // if (ev.data.name.toLowerCase() === "image") {
    // const dialogDefinition = ev.data.definition;
    // const uploadTab = dialogDefinition.getContents("Upload");
    // uploadTab.hide();
    // }
    // });
    // }

    override writeValue(value: string | null): void {
        super.writeValue(value);
        if (this.editor) this.editor.setData(value || "", { internal: true });
    }

    private static loadScript(src: string): Promise<void> {
        if (this.isScriptLoaded[src]) return Promise.resolve();
        if (this.loadPromise[src]) return this.loadPromise[src];

        this.loadPromise[src] = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = () => {
                this.isScriptLoaded[src] = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });

        return this.loadPromise[src];
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["value"]) {
            this.editor?.setData(this.value() ?? "");
        }
    }
}
