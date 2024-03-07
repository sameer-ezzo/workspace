import { Component, EventEmitter, forwardRef, Input, Output, SimpleChanges, ViewChild } from "@angular/core";
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Condition } from "@noah-ark/expression-engine";
import { ActionDescriptor, InputBaseComponent } from "@upupa/common";
import { LanguageService } from "@upupa/language";
import { ActionsDescriptor } from "@upupa/common";
import { Field, FormScheme } from "../types";
import { CollectStyle, FormDesign } from "./types";
import { fieldsArrayToPages, FormPage, getGoogleFontUri, loadFontFromUri } from "./utils";
import { DynamicFormComponent } from "../dynamic-form.component";
import { delay } from "@noah-ark/common";

@Component({
  selector: "collector",
  templateUrl: "./collector.component.html",
  styleUrls: ["./collector.component.scss"],
  exportAs: "collector",
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CollectorComponent), multi: true },
  { provide: NG_VALIDATORS, useExisting: forwardRef(() => CollectorComponent), multi: true }

  ],
})
export class CollectorComponent extends InputBaseComponent<any> {
  @ViewChild("dynForm") dynamicForm: DynamicFormComponent;

  @Output() submit = new EventEmitter();
  @Output() action = new EventEmitter<ActionDescriptor>();
  @Output() activePageChange = new EventEmitter<number>();

  private _collectStyle: CollectStyle;
  @Input()
  public get collectStyle(): CollectStyle {
    return this._collectStyle;
  }
  public set collectStyle(v: CollectStyle) {
    this._collectStyle = v;
    if (this.fields) this.populatePagesInFields();
  }

  @Input() fields: FormScheme;
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

  @Input() submitBtn: ActionDescriptor = { action: "submit", type: 'submit', variant: "stroked", text: "Submit", color: "primary" };
  @Input() nextBtn: ActionDescriptor = { action: "next", type: 'button', text: "Next" };
  @Input() prevBtn: ActionDescriptor = { action: "prev", type: 'button', text: "Previous" };
  @Input() initialValueFactory: () => Promise<any>;

  private formFieldsInfo: { [name: string]: { index: number; page: number } } = null;
  private _focusedField: Field;
  @Input()
  public get focusedField(): Field {
    return this._focusedField;
  }
  public set focusedField(v: Field) {
    if (this._focusedField === v) return;
    this._focusedField = v;
    if (this.pages?.length === 0) this.populatePagesInFields();

    this.activePage = v ? this.formFieldsInfo[v.name].page : null;
    setTimeout(() => {
      const element = document.getElementById(v.name);
      if (this.dynamicForm) this.dynamicForm.scrollToElement(element, true);
    }, 300);
  }

  pages: FormPage[] = [];
  _pageInvalid = true;
  loading = false;

  constructor(public languageService: LanguageService) {
    super();
  }

  get formElement() {
    return this.dynamicForm.formElement;
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

  private _applyFormDesign(design: FormDesign) {
    if (design.bgImage?.url) document.documentElement.style.setProperty("--bg-img-url", design.bgImage.url);
    if (design.bgColor) document.documentElement.style.setProperty("--bg-color", design.bgColor);
    if (design.textColor) document.documentElement.style.setProperty("--field-text-color", design.textColor);
    if (design.valueColor) document.documentElement.style.setProperty("--field-value-color", design.valueColor);
    if (design.buttonsColor) document.documentElement.style.setProperty("--button-color", design.buttonsColor);

    if (design.headerFont) {
      loadFontFace(this.design.headerFont.font.family);
      document.documentElement.style.setProperty("--header-font-family", this.design.headerFont.font.family);
    }
    if (design.paragraphFont) {
      loadFontFace(this.design.paragraphFont.font.family);
      document.documentElement.style.setProperty("--paragraph-font-family", this.design.paragraphFont.font.family);
      document.documentElement.style.setProperty("--paragraph-font-size", this.design.paragraphFont.size || "22pt");
    }
  }

  override async ngOnChanges(changes: SimpleChanges) {
    super.ngOnChanges(changes);
    if (changes["initialValueFactory"] && this.initialValueFactory) this.value = await this.initialValueFactory();
    if (changes["fields"] && !changes["fields"].firstChange) this.populatePagesInFields();
  }

  ngOnInit() {
    if (!this.formFieldsInfo && this.fields) this.populatePagesInFields();
  }

  populatePagesInFields() {
    const fields = Object.values(this.fields);
    this.pages = fieldsArrayToPages(this.collectStyle, fields);

    this.formFieldsInfo = {};
    for (let i = 0; i < this.pages.length; i++) {
      const pfs = this.pages[i].fields;
      for (let j = 0; j < pfs.length; j++) this.formFieldsInfo[pfs[j].name] = { index: j, page: i };
    }

    this.showFieldsOfPage();
  }

  _checkPageInvalid(pageIndex: number) {
    if (pageIndex < 0 || pageIndex > this.pages.length - 1) {
      this._pageInvalid = false;
      return;
    }

    const page = this.pages[pageIndex];
    this._pageInvalid = this.dynamicForm && page.fields.some((f) => this.dynamicForm.formRenderer.controls.get(f)?.invalid === true);
  }

  showFieldsOfPage() {
    const fields = Object.values(this.fields);
    if (this.activePage > -1) {
      fields.forEach((f: any) => {
        const info = this.formFieldsInfo[f.name];
        const hidden = info && info.page !== this.activePage;
        this.fields[f.name].ui = { ...f.ui, hidden };
      });
    }
    this._checkPageInvalid(this.activePage);
  }

  async actionClicked(action: ActionDescriptor) {
    this.action.emit(action);
  }

  async onSubmit() {
    this.loading = true;
    await delay(5000);
    this._checkPageInvalid(this.activePage);
    if (!this._pageInvalid) this.submit.emit(this.dynamicForm.value);
    this.loading = false;
  }

  canGoNext() {
    return !this._pageInvalid && this.activePage < this.totalPages - 1;
  }

  canGoPrev() {
    return this.activePage > 0;
  }

  next() {
    this.dynamicForm?.formElement.control.markAsTouched();
    if (this.canGoNext()) this.activePage++;
  }

  prev() {
    if (this.canGoPrev()) this.activePage--;
  }
}

function loadFontFace(family: string) {
  const fontUri = getGoogleFontUri(family);
  loadFontFromUri(fontUri);

  const head = document.head || document.getElementsByTagName("head")[0];
  const preconnect = document.createElement("link");
  preconnect.href = "https://fonts.gstatic.com";
  preconnect.rel = "preconnect";
  head.appendChild(preconnect);

  const stylesheet = document.createElement("link");
  stylesheet.href = fontUri;
  stylesheet.rel = "stylesheet";
  head.appendChild(stylesheet);

  const newStyle = document.createElement("style");
  newStyle.appendChild(document.createTextNode(`@font-face {font-family: " + ${family} + "src: url('" + ${fontUri} + "')}`));
  document.head.appendChild(newStyle);
}
