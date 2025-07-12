import {
    Component,
    forwardRef,
    ViewEncapsulation,
    inject,
    input,
    ElementRef,
    viewChild,
    SimpleChanges,
    effect,
    HostListener,
    PLATFORM_ID,
    InjectionToken,
    OnChanges,
    AfterViewInit,
    OnDestroy,
    LOCALE_ID,
    computed,
} from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";

import { HtmlUploadAdapter } from "../html-upload-adapter";
import { ErrorsDirective, InputBaseComponent } from "@upupa/common";
import { UploadClient, UploadModule } from "@upupa/upload";
import { AuthService } from "@upupa/auth";
import { isPlatformBrowser } from "@angular/common";
import { OutputData, ToolConstructable } from "@editorjs/editorjs";
import { languageDir } from "@upupa/language";
import { FileInfo } from "@noah-ark/common";
import { EDITOR_JS_AI_PROMPT } from "../di.token";

declare let EditorJS: any;
declare let Header: any;
declare let List: any;
declare let Warning: any;
declare let Paragraph: any;
declare let Quote: any;
declare let Delimiter: any;

@Component({
    selector: "editor-js-input",
    templateUrl: "./editor-js.component.html",
    styleUrls: ["./editor-js.component.scss"],
    imports: [UploadModule, ErrorsDirective],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EditorJsInputComponent),
            multi: true,
        },
    ],
    host: {
        "[attr.id]": "id",
        "[class]": "classList()",
    },
})
export class EditorJsInputComponent extends InputBaseComponent<OutputData> implements OnChanges, AfterViewInit, OnDestroy {
    readOnly = input(false);
    placeholder = input("");
    label = input("");
    hint = input("");
    mode = input<"classic" | "document">("document");
    uploadPath = input("/editor-js-assets");
    classList = computed(() => (this.readOnly() ? "readonly" : ""));
    private readonly uploadClient = inject(UploadClient);
    private readonly auth = inject(AuthService);

    private readonly aiPrompt = inject(EDITOR_JS_AI_PROMPT, { optional: true });
    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly el = inject(ElementRef<HTMLElement>);
    editorElement = viewChild<ElementRef<HTMLTextAreaElement>>("editor");

    tools = input(["Header", "List", "Warning", "Paragraph", "Quote", "Delimiter", "Image", "Audio", "AIText"], { transform: (x: any) => x ?? [] });
    language = input(inject(LOCALE_ID, { optional: true }) ?? (typeof navigator !== "undefined" ? navigator.language : undefined) ?? "en-US");
    dir = computed(() => languageDir(this.language()));

    private editor: any; // EditorJS;
    private _editor: Promise<any>;

    async ngAfterViewInit() {
        const el = this.editorElement();
        if (!el) return;

        this.editor = await this._init();
    }

    async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes["placeholder"] || changes["tools"]) {
            this.editor = await this._init(true);
        }

        if (changes["value"]) {
            this.control().setValue(this.value());
            // this.editor?.blocks.render(this.value());
        }
        if (changes["readOnly"]) {
            // this.editor?.readOnly(this.readOnly());
            this.editor?.readOnly.toggle(this.readOnly());
        }
    }

    @HostListener("blur")
    onBlur(): void {
        this.markAsTouched();
    }

    private async _init(force = false): Promise<any> {
        if (!this.isBrowser) return;
        if (!force && this._editor) return this.editor;

        this._editor = Promise.all([this._loadTools(this.tools()), import("@editorjs/editorjs").then((m) => m.default)]).then(([tools, EditorJS]) => {
            const editor = new EditorJS({
                holder: this.editorElement().nativeElement,
                tools,
                placeholder: this.placeholder(),
                data: this.value(),
                i18n: {
                    direction: this.dir(),
                },
                readOnly: this.readOnly(),

                onReady: () => {
                    this.updatePadding();
                },
                onChange: async (api, event) => {
                    if (event instanceof CustomEvent && event.type !== "block-changed") return;
                    const data = await editor.saver.save();
                    this.handleUserInput(data);
                },
            });

            return editor;
        });
        const editor = await this._editor;
        await editor.isReady;
        return editor;
    }

    private updatePadding(): void {
        const editorContainer: HTMLElement = this.editorElement().nativeElement.querySelector(".codex-editor__redactor");
        if (editorContainer) {
            editorContainer.style.paddingBottom = this.readOnly() ? "0" : "0";
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
    private async _loadTools(tools: string[]) {
        /**
         * Upload file to the server and return an uploaded image data
         * @param {File} file - file selected from the device or pasted by drag-n-drop
         * @return {Promise.<{success, file: {url}}>}
         */
        const uploadByFile = (file) => {
            // your own uploading logic here
            return this.uploadClient.uploadAsync(this.uploadPath(), file, file.name ?? Date.now()).then((fi: FileInfo) => {
                return {
                    success: 1,
                    file: {
                        ...file,
                        url: this.uploadClient.baseOrigin + fi.path,
                    },
                };
            });
        };

        /**
         * Send URL-string to the server. Backend should load image by this URL and return an uploaded image data
         * @param {string} url - pasted image URL
         * @return {Promise.<{success, file: {url}}>}
         */
        const uploadByUrl = (url) => {
            return Promise.resolve({
                success: 1,
                file: {
                    url,
                },
            });
            // your ajax request for uploading
        };

        const toolsMap = {};
        tools ??= [];
        if (tools.includes("Header")) {
            const Header = await import("@editorjs/header").then((m) => m.default);
            toolsMap["header"] = { class: Header };
        }
        if (tools.includes("List")) {
            const EditorjsList = await import("@editorjs/list").then((m) => m.default);
            toolsMap["list"] = { class: EditorjsList };
        }
        if (tools.includes("Warning")) {
            const Warning = await import("@editorjs/warning").then((m) => m.default);
            toolsMap["warning"] = {
                class: Warning,
                inlineToolbar: true,
                shortcut: "CMD+SHIFT+W",
                config: {
                    titlePlaceholder: "Title",
                    messagePlaceholder: "Message",
                },
            };
        }
        if (tools.includes("Paragraph")) {
            const Paragraph = await import("@editorjs/paragraph").then((m) => m.default);
            toolsMap["paragraph"] = {
                class: Paragraph,
                inlineToolbar: true,
            };
        }
        if (tools.includes("Quote")) {
            const Quote = await import("@editorjs/quote").then((m) => m.default);
            toolsMap["quote"] = { class: Quote };
        }
        if (tools.includes("Delimiter")) {
            const Delimiter = await import("@editorjs/delimiter").then((m) => m.default);
            toolsMap["delimiter"] = { class: Delimiter };
        }
        if (tools.includes("Image")) {
            const ImageTool = await import("@editorjs/image").then((m) => m.default);
            toolsMap["image"] = {
                class: ImageTool,
                config: {
                    /**
                     * Custom uploader
                     */
                    uploader: {
                        uploadByFile,
                        uploadByUrl,
                    },
                },
            };
        }
        if (tools.includes("Audio")) {
            const AudioTool = await import("@furison-tech/editorjs-audio").then((m) => m.default);
            toolsMap["audio"] = {
                class: AudioTool,
                config: {
                    /**
                     * Custom uploader
                     */
                    uploader: {
                        uploadByFile,
                        uploadByUrl,
                    },
                },
            };
        }

        if (tools.includes("AIText")) {
            const AIText = await import("@alkhipce/editorjs-aitext").then((m) => m.default);
            toolsMap["aiText"] = {
                // if you do not use TypeScript you need to remove "as unknown as ToolConstructable" construction
                // type ToolConstructable imported from @editorjs/editorjs package
                class: AIText as unknown as ToolConstructable,
                config: {
                    // here you need to provide your own suggestion provider (e.g., request to your backend)
                    // this callback function must accept a string and return a Promise<string>
                    callback: this.aiPrompt
                        ? this.aiPrompt
                        : (text: string) => {
                              return new Promise((resolve) => {
                                  setTimeout(() => {
                                      resolve(text);
                                  }, 1000);
                              });
                          },
                },
            };
        }

        return toolsMap;
    }
}
