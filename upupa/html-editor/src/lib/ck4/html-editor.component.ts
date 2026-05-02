import { isPlatformBrowser, LocationStrategy } from "@angular/common";
import { Component, DOCUMENT, ElementRef, forwardRef, inject, input, OnDestroy, PLATFORM_ID, SimpleChanges, viewChild } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { loadScript } from "@noah-ark/common";
import { AuthTokenAccessor } from "@upupa/auth";
import { ErrorsDirective, InputBaseComponent } from "@upupa/common";
import { UploadClient } from "@upupa/upload";

declare let CKEDITOR: any;

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
    imports: [ErrorsDirective],
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
    authToken = inject(AuthTokenAccessor);
    doc = inject(DOCUMENT);

    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    private editor: any;
    private isEditorReady = false;
    private pendingData: string | null = null;

    async ngAfterViewInit() {
        if (!this.isBrowser) return;
        await this.loadEditor();
    }

    private baseHref = inject(LocationStrategy).getBaseHref();

    private normalizedLanguage(): string | undefined {
        const value = `${this.language() || ""}`.trim();
        return value || undefined;
    }

    private normalizedDir(): "ltr" | "rtl" | undefined {
        const value = `${this.dir() || ""}`.trim().toLowerCase();
        if (value === "rtl" || value === "ltr") return value;
        return undefined;
    }

    private getEditorConfig() {
        const language = this.normalizedLanguage();
        const contentsLangDirection = this.normalizedDir();
        const requestedBaseFloatZIndex = Number(this.config()?.baseFloatZIndex ?? 0);
        const baseFloatZIndex = Number.isFinite(requestedBaseFloatZIndex) ? Math.max(100000, requestedBaseFloatZIndex) : 100000;

        return {
            licenseKey: "GPL",
            versionCheck: false,
            uiColor: "#fff7f9",
            toolbar: SMART_TOOLBAR,

            extraPlugins: "image2,pastefromword, pastefromgdocs",
            removePlugins: "image,exportpdf",
            embed_provider: "//ckeditor.iframe.ly/api/oembed?url={url}&callback={callback}",
            clipboard_handleImages: false,
            uploadUrl: `${this.upload.baseUrl}/${this.uploadPath()}`,
            filebrowserUploadUrl: `${this.upload.baseUrl}/${this.uploadPath()}`,
            filebrowserImageUploadUrl: `${this.upload.baseUrl}/${this.uploadPath()}`,
            // filebrowserBrowseUrl: this.uploadPath(),
            //filebrowserImageBrowseUrl,
            image2_alignClasses: ["image-left", "image-center", "image-right"],
            image2_captionedClass: "image-captioned",

            // https://ckeditor.com/docs/ckeditor4/latest/guide/dev_allowed_content_rules.html
            extraAllowedContent: "*[style,id](*);iframe[*]{*}[*]'; figure()[]; oembed[];source[];",
            // disallowedContent: "*{font-family,font-size}",
            allowedContent: true,
            protectedSource: [/<iframe[\s\S]*?<\/iframe>/gi],
            startupFocus: false,

            ...this.config(),
            baseFloatZIndex,
            language,
            contentsLanguage: language,
            contentsLangDirection,
        };
    }

    private async ensureEditorScriptLoaded(): Promise<void> {
        if (typeof CKEDITOR !== "undefined") return;

        const src = `${this.baseHref}ckeditor/ckeditor.js?v=0.0.1`;
        if (CKEditor4Component.isScriptLoaded[src]) return;

        if (!CKEditor4Component.loadPromise[src]) {
            CKEditor4Component.loadPromise[src] = loadScript(this.doc, src)
                .then(() => {
                    CKEditor4Component.isScriptLoaded[src] = true;
                })
                .finally(() => {
                    CKEditor4Component.loadPromise[src] = null;
                });
        }

        await CKEditor4Component.loadPromise[src];
    }

    private setEditorData(value: string): void {
        if (!this.editor) return;

        if (this.isEditorReady) {
            this.editor.setData(value || "", { internal: true });
        } else {
            this.pendingData = value || "";
        }
    }

    private isKnownDestroyRace(error: unknown): boolean {
        const message = error instanceof Error ? error.message : `${error ?? ""}`;
        const stack = error instanceof Error ? error.stack ?? "" : "";
        return message.includes("reading 'blur'") || stack.includes("focusManager.remove");
    }

    private destroyEditor(): void {
        if (!this.editor) return;

        try {
            this.editor.destroy(true);
        } catch (error) {
            if (!this.isKnownDestroyRace(error)) {
                console.warn("CKEditor destroy failed", error);
            }
        }

        this.editor = null;
        this.isEditorReady = false;
        this.pendingData = null;
    }

    private async recreateEditor(): Promise<void> {
        if (!this.editorElement()) return;
        const data = this.editor?.getData?.() ?? this.value() ?? "";
        this.destroyEditor();
        await this.loadEditor(data);
    }

    private async loadEditor(initialData?: string): Promise<void> {
        await this.ensureEditorScriptLoaded();

        const config = this.getEditorConfig();
        this.editor = CKEDITOR.replace(this.editorElement()?.nativeElement, config);
        this.isEditorReady = false;
        this.pendingData = initialData ?? this.value() ?? "";

        this.editor.on("instanceReady", () => {
            this.isEditorReady = true;
            if (this.pendingData !== null) {
                const next = this.pendingData;
                this.pendingData = null;
                this.editor?.setData(next, { internal: true });
            }
        });

        // Handle editor changes
        this.editor.on("change", () => {
            if (!this.isEditorReady) return;
            const value = this.editor.getData();
            this.handleUserInput(value);
        });

        this.editor.on("fileUploadRequest", (evt) => {
            const xhr = evt.data.fileLoader.xhr;
            xhr.setRequestHeader("Authorization", "Bearer " + this.authToken.getToken());
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
        if (this.editor) this.setEditorData(value || "");
    }

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        await super.ngOnChanges(changes);

        const languageChanged = !!changes["language"] && !changes["language"].firstChange;
        const dirChanged = !!changes["dir"] && !changes["dir"].firstChange;

        if (this.isBrowser && this.editor && (languageChanged || dirChanged)) {
            await this.recreateEditor();
        }

        if (changes["value"]) {
            this.setEditorData(this.value() ?? "");
        }
    }

    ngOnDestroy(): void {
        this.destroyEditor();
    }
}
