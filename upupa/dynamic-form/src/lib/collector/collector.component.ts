import { Component, computed, forwardRef, inject, input, model, output, signal, SimpleChanges, viewChild, DOCUMENT } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { Condition } from "@noah-ark/expression-engine";
import { ActionDescriptor, InputBaseComponent, UtilsModule } from "@upupa/common";
import { ActionsDescriptor } from "@upupa/common";
import { Field, FormScheme } from "../types";
import { CollectStyle, FormDesign } from "./types";
import { fieldsArrayToPages, FormPage, getGoogleFontUri, loadFontFromUri } from "./utils";
import { DynamicFormComponent, ExtendedValueChangeEvent, FORM_GROUP } from "../dynamic-form.component";
import { CommonModule } from "@angular/common";
import { MatBtnComponent } from "@upupa/mat-btn";

@Component({
    selector: "collector",
    imports: [DynamicFormComponent, CommonModule, UtilsModule, MatBtnComponent],
    templateUrl: "./collector.component.html",
    styleUrls: ["./collector.component.scss"],
    exportAs: "collector",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CollectorComponent),
            multi: true,
        },
        {
            provide: FORM_GROUP,
            useFactory: (self: CollectorComponent) => self.dynamicForm().form(),
            deps: [CollectorComponent],
        },
    ],
})
export class CollectorComponent<T = any> extends InputBaseComponent<T> {
    dynamicForm = viewChild<DynamicFormComponent>("dynForm");
    form = computed(() => this.dynamicForm().form());
    valid = computed(() => this.dynamicForm().form().valid);
    touched = computed(() => this.dynamicForm().form().touched);
    submit = output<T>();
    action = output<ActionDescriptor>();
    activePageChange = output<number>();
    fieldValueChange = output<ExtendedValueChangeEvent<T>>();

    collectStyle = input<CollectStyle>("linear");

    fields = input.required<FormScheme>();
    conditions = input<Condition[]>([]);
    actions = input<ActionsDescriptor>();

    activePage = model<number>();

    submitBtn = input<ActionDescriptor>({
        name: "submit",
        type: "submit",
        variant: "stroked",
        text: "Submit",
        color: "primary",
    });
    nextBtn = input<ActionDescriptor>({
        name: "next",
        type: "button",
        text: "Next",
    });
    prevBtn = input<ActionDescriptor>({
        name: "prev",
        type: "button",
        text: "Previous",
    });

    private formFieldsInfo = new Map<Field, { index: number; page: number }>();

    pages: FormPage[] = [];
    _pageInvalid = signal(false);
    loading = signal(false);
    focusedField = input<Field>();
    design = input<FormDesign>();

    get controls() {
        return this.dynamicForm().form().controls;
    }

    get formElement() {
        return this.form();
    }

    _totalPages: number;
    get totalPages() {
        return this.pages.length;
    }

    private readonly document = inject(DOCUMENT);

    override async ngOnChanges(changes: SimpleChanges) {
        await super.ngOnChanges(changes);
        if (changes["design"]) applyFormDesign(this.document, this.design(), this.document.documentElement);
        if (changes["fields"] || changes["focusedField"]) {
            if (this.pages?.length === 0) this.populatePagesInFields();
            const v = this.focusedField();
            this.activePage.set(v ? this.formFieldsInfo.get(v).page : null);
            // setTimeout(() => {
            //     const element = this.document.getElementById(v.name);
            //     if (this.dynamicForm) this.dynamicForm.scrollToElement(element, true);
            // }, 300);
        }
        if (changes["activePage"]) this.showFieldsOfPage();
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
        if (pageIndex < 0 || pageIndex > this.pages.length - 1) return this._pageInvalid.set(false);

        const page = this.pages[pageIndex];
        if (page?.fields) this._pageInvalid.set(Object.values(page.fields).some((f) => f.invalid === true));
    }

    showFieldsOfPage() {
        const fields = this.fields();

        if (this.activePage() > -1) {
            Object.values(fields).forEach((f: any) => {
                const info = this.formFieldsInfo[f.name];
                const hidden = info && info.page !== this.activePage();
                f.inputs ??= {};
                f.inputs["hidden"] = hidden;
            });
        }
        this._checkPageInvalid(this.activePage());
    }

    async actionClicked(action: ActionDescriptor) {
        this.action.emit(action);
    }

    async onSubmit() {
        this.loading.set(true);
        this._checkPageInvalid(this.activePage());
        if (!this._pageInvalid()) this.submit.emit(this.value());
        this.loading.set(false);
    }

    canGoNext() {
        return !this._pageInvalid() && this.activePage() < this.totalPages - 1;
    }

    canGoPrev() {
        return this.activePage() > 0;
    }

    next() {
        this.dynamicForm().form().markAsTouched();
        if (this.canGoNext()) this.activePage.update((a) => a + 1);
    }

    prev() {
        if (this.canGoPrev()) this.activePage.update((a) => a - 1);
    }
}

function loadFontFace(doc, family: string) {
    const fontUri = getGoogleFontUri(family);
    loadFontFromUri(doc, fontUri);

    const head = doc.head || doc.getElementsByTagName("head")[0];
    const preconnect = doc.createElement("link");
    preconnect.href = "https://fonts.gstatic.com";
    preconnect.rel = "preconnect";
    head.appendChild(preconnect);

    const stylesheet = doc.createElement("link");
    stylesheet.href = fontUri;
    stylesheet.rel = "stylesheet";
    head.appendChild(stylesheet);

    const newStyle = doc.createElement("style");
    newStyle.appendChild(doc.createTextNode(`@font-face {font-family: " + ${family} + "src: url('" + ${fontUri} + "')}`));
    doc.head.appendChild(newStyle);
}

function applyFormDesign(document: Document, design: FormDesign, el: HTMLElement) {
    if (design.bgImage?.url) el.style.setProperty("--bg-img-url", design.bgImage.url);
    if (design.bgColor) el.style.setProperty("--bg-color", design.bgColor);
    if (design.textColor) el.style.setProperty("--field-text-color", design.textColor);
    if (design.valueColor) el.style.setProperty("--field-value-color", design.valueColor);
    if (design.buttonsColor) el.style.setProperty("--button-color", design.buttonsColor);

    if (design.headerFont) {
        loadFontFace(document, design.headerFont.font.family);
        el.style.setProperty("--header-font-family", design.headerFont.font.family);
    }
    if (design.paragraphFont) {
        loadFontFace(document, design.paragraphFont.font.family);
        el.style.setProperty("--paragraph-font-family", design.paragraphFont.font.family);
        el.style.setProperty("--paragraph-font-size", design.paragraphFont.size || "22pt");
    }
}
