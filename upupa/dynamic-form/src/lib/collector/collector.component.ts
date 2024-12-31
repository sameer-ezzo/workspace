import { Component, computed, forwardRef, inject, input, model, output, signal, SimpleChanges, viewChild } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { Condition } from "@noah-ark/expression-engine";
import { ActionDescriptor, InputBaseComponent, UtilsModule } from "@upupa/common";
import { ActionsDescriptor } from "@upupa/common";
import { Field, FormScheme } from "../types";
import { CollectStyle, FormDesign } from "./types";
import { fieldsArrayToPages, FormPage, getGoogleFontUri, loadFontFromUri } from "./utils";
import { DynamicFormComponent, ExtendedValueChangeEvent, FORM_GRAPH } from "../dynamic-form.component";
import { CommonModule, DOCUMENT } from "@angular/common";
import { MatBtnComponent } from "@upupa/mat-btn";

@Component({
    selector: "collector",
    standalone: true,
    imports: [DynamicFormComponent, CommonModule, UtilsModule, MatBtnComponent],
    templateUrl: "./collector.component.html",
    styleUrls: ["./collector.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CollectorComponent),
            multi: true,
        },
        {
            provide: FORM_GRAPH,
            useFactory: (self: CollectorComponent) => self.dynamicForm().graph,
            deps: [CollectorComponent],
        },
    ],
})
export class CollectorComponent extends InputBaseComponent<any> {
    dynamicForm = viewChild<DynamicFormComponent>("dynForm");
    form = computed(() => this.dynamicForm().control());
    submit = output();
    action = output<ActionDescriptor>();
    activePageChange = output<number>();
    fieldValueChange = output<ExtendedValueChangeEvent<any>>();

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
    _pageInvalid = signal(true);
    loading = signal(false);

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
    focusedField = input<Field>();

    design = input<FormDesign>();

    private readonly document = inject(DOCUMENT);

    private _applyFormDesign(design: FormDesign) {
        if (design.bgImage?.url) this.document.documentElement.style.setProperty("--bg-img-url", design.bgImage.url);
        if (design.bgColor) this.document.documentElement.style.setProperty("--bg-color", design.bgColor);
        if (design.textColor) this.document.documentElement.style.setProperty("--field-text-color", design.textColor);
        if (design.valueColor) this.document.documentElement.style.setProperty("--field-value-color", design.valueColor);
        if (design.buttonsColor) this.document.documentElement.style.setProperty("--button-color", design.buttonsColor);

        if (design.headerFont) {
            loadFontFace(this.document, design.headerFont.font.family);
            this.document.documentElement.style.setProperty("--header-font-family", design.headerFont.font.family);
        }
        if (design.paragraphFont) {
            loadFontFace(this.document, design.paragraphFont.font.family);
            this.document.documentElement.style.setProperty("--paragraph-font-family", design.paragraphFont.font.family);
            this.document.documentElement.style.setProperty("--paragraph-font-size", design.paragraphFont.size || "22pt");
        }
    }

    async ngOnChanges(changes: SimpleChanges) {
        if (changes["design"]) this._applyFormDesign(this.design());
        if (changes["fields"]) this.populatePagesInFields();
        if (changes["activePage"]) this.showFieldsOfPage();
        if (changes["focusedField"]) {
            if (this.pages?.length === 0) this.populatePagesInFields();
            const v = this.focusedField();
            this.activePage.set(v ? this.formFieldsInfo.get(v).page : null);
            // setTimeout(() => {
            //     const element = this.document.getElementById(v.name);
            //     if (this.dynamicForm) this.dynamicForm.scrollToElement(element, true);
            // }, 300);
        }
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
            this._pageInvalid.set(false);
            return;
        }

        const page = this.pages[pageIndex];
        if (page?.fields) this._pageInvalid.set(Array.from(page.fields).some(([name, f]) => this.controls.get("")?.control.invalid === true));
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
        if (!this._pageInvalid) this.submit.emit(this.value());
        this.loading.set(false);
    }

    canGoNext() {
        return !this._pageInvalid && this.activePage() < this.totalPages - 1;
    }

    canGoPrev() {
        return this.activePage() > 0;
    }

    next() {
        this.dynamicForm().control().markAsTouched();
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
