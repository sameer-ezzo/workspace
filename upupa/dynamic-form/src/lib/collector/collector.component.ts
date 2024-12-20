import { Component, computed, EventEmitter, forwardRef, inject, input, Input, Output, SimpleChanges, viewChild } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { Condition } from "@noah-ark/expression-engine";
import { ActionDescriptor, InputBaseComponent, UtilsModule } from "@upupa/common";
import { ActionsDescriptor } from "@upupa/common";
import { Field, FormScheme } from "../types";
import { CollectStyle, FormDesign } from "./types";
import { fieldsArrayToPages, FormPage, getGoogleFontUri, loadFontFromUri } from "./utils";
import { DynamicFormComponent } from "../dynamic-form.component";
import { CommonModule, DOCUMENT } from "@angular/common";
import { MatBtnComponent } from "@upupa/mat-btn";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { MatExpansionModule } from "@angular/material/expansion";
import { DynamicFormNativeThemeModule } from "@upupa/dynamic-form-native-theme";

@Component({
    selector: "collector",
    standalone: true,
    imports: [
        DynamicFormComponent,
        CommonModule,
        UtilsModule,
        FormsModule,
        ReactiveFormsModule,
        ScrollingModule,
        DynamicFormNativeThemeModule,
        MatBtnComponent,
        MatExpansionModule,
    ],
    templateUrl: "./collector.component.html",
    styleUrls: ["./collector.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CollectorComponent),
            multi: true,
        },
    ],
})
export class CollectorComponent extends InputBaseComponent<any> {
    dynamicForm = viewChild<DynamicFormComponent>("dynForm");
    form = computed(() => this.dynamicForm().control());
    @Output() submit = new EventEmitter();
    @Output() action = new EventEmitter<ActionDescriptor>();
    @Output() activePageChange = new EventEmitter<number>();

    collectStyle = input<CollectStyle>("linear");

    fields = input.required<FormScheme>();
    @Input() conditions: Condition[];
    @Input() actions: ActionsDescriptor;
    _activePage = 0;
    @Input()
    get activePage() {
        return this._activePage;
    }
    set activePage(value: number) {
        this._activePage = value;
        this.showFieldsOfPage();
        this.activePageChange.emit(this._activePage);
    }

    @Input() submitBtn: ActionDescriptor = {
        name: "submit",
        type: "submit",
        variant: "stroked",
        text: "Submit",
        color: "primary",
    };
    @Input() nextBtn: ActionDescriptor = {
        name: "next",
        type: "button",
        text: "Next",
    };
    @Input() prevBtn: ActionDescriptor = {
        name: "prev",
        type: "button",
        text: "Previous",
    };

    private formFieldsInfo = new Map<Field, { index: number; page: number }>();

    private _focusedField: Field;
    @Input()
    public get focusedField(): Field {
        return this._focusedField;
    }
    public set focusedField(v: Field) {
        if (this._focusedField === v) return;
        this._focusedField = v;
        if (this.pages?.length === 0) this.populatePagesInFields();

        this.activePage = v ? this.formFieldsInfo.get(v).page : null;
        // setTimeout(() => {
        //     const element = this.document.getElementById(v.name);
        //     if (this.dynamicForm) this.dynamicForm.scrollToElement(element, true);
        // }, 300);
    }

    pages: FormPage[] = [];
    _pageInvalid = true;
    loading = false;

    get controls() {
        return this.dynamicForm().graph;
    }

    get formElement() {
        return this.form();
    }

    _totalPages: number;
    get totalPages() {
        return this.pages.length;
    }

    private _design: FormDesign;
    @Input()
    public get design(): FormDesign {
        return this._design;
    }
    public set design(v: FormDesign) {
        this._design = v;
        this._applyFormDesign(v);
    }
    private readonly document = inject(DOCUMENT);

    private _applyFormDesign(design: FormDesign) {
        if (design.bgImage?.url) this.document.documentElement.style.setProperty("--bg-img-url", design.bgImage.url);
        if (design.bgColor) this.document.documentElement.style.setProperty("--bg-color", design.bgColor);
        if (design.textColor) this.document.documentElement.style.setProperty("--field-text-color", design.textColor);
        if (design.valueColor) this.document.documentElement.style.setProperty("--field-value-color", design.valueColor);
        if (design.buttonsColor) this.document.documentElement.style.setProperty("--button-color", design.buttonsColor);

        if (design.headerFont) {
            loadFontFace(this.document, this.design.headerFont.font.family);
            this.document.documentElement.style.setProperty("--header-font-family", this.design.headerFont.font.family);
        }
        if (design.paragraphFont) {
            loadFontFace(this.document, this.design.paragraphFont.font.family);
            this.document.documentElement.style.setProperty("--paragraph-font-family", this.design.paragraphFont.font.family);
            this.document.documentElement.style.setProperty("--paragraph-font-size", this.design.paragraphFont.size || "22pt");
        }
    }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes["fields"]) this.populatePagesInFields();
    }

    populatePagesInFields() {
        this.pages = fieldsArrayToPages(this.collectStyle(), this.controls);

        this.formFieldsInfo = new Map();
        for (let i = 0; i < this.pages.length; i++) {
            const pfs = Object.entries(this.pages[i].fields);
            for (let j = 0; j < pfs.length; j++) this.formFieldsInfo[pfs[j][0]] = { index: j, page: i };
        }

        this.showFieldsOfPage();
    }

    _checkPageInvalid(pageIndex: number) {
        if (pageIndex < 0 || pageIndex > this.pages.length - 1) {
            this._pageInvalid = false;
            return;
        }

        const page = this.pages[pageIndex];
        this._pageInvalid = Array.from(page.fields).some(([name, f]) => this.controls.get("")?.control.invalid === true);
    }

    showFieldsOfPage() {
        const fields = this.fields();

        if (this.activePage > -1) {
            Object.values(fields).forEach((f: any) => {
                const info = this.formFieldsInfo[f.name];
                const hidden = info && info.page !== this.activePage;
                f.ui = { ...f.ui, hidden };
            });
        }
        this._checkPageInvalid(this.activePage);
    }

    async actionClicked(action: ActionDescriptor) {
        this.action.emit(action);
    }

    async onSubmit() {
        this.loading = true;
        this._checkPageInvalid(this.activePage);
        if (!this._pageInvalid) this.submit.emit(this.value());
        this.loading = false;
    }

    canGoNext() {
        return !this._pageInvalid && this.activePage < this.totalPages - 1;
    }

    canGoPrev() {
        return this.activePage > 0;
    }

    next() {
        this.dynamicForm().control().markAsTouched();
        if (this.canGoNext()) this.activePage++;
    }

    prev() {
        if (this.canGoPrev()) this.activePage--;
    }
}

function loadFontFace(doc, family: string) {
    const fontUri = getGoogleFontUri(family);
    loadFontFromUri(doc, fontUri);

    const head = this.document.head || this.document.getElementsByTagName("head")[0];
    const preconnect = this.document.createElement("link");
    preconnect.href = "https://fonts.gstatic.com";
    preconnect.rel = "preconnect";
    head.appendChild(preconnect);

    const stylesheet = this.document.createElement("link");
    stylesheet.href = fontUri;
    stylesheet.rel = "stylesheet";
    head.appendChild(stylesheet);

    const newStyle = this.document.createElement("style");
    newStyle.appendChild(this.document.createTextNode(`@font-face {font-family: " + ${family} + "src: url('" + ${fontUri} + "')}`));
    this.document.head.appendChild(newStyle);
}
