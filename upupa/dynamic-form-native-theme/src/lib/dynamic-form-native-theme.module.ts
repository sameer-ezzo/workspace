import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ErrorsDirective, UtilsModule } from "@upupa/common";

import { UploadModule } from "@upupa/upload";
import { AddressComponent } from "./address-edit/address.component";
import { AutoCompleteTextComponent } from "./autocomplete-text-input/autocomplete-text.component";
import { ChoicesComponent } from "./choices/choices.component";
import { ColorInputComponent } from "./color-input/color-input.component";
import { DateInputComponent } from "./date-input/date-input.component";
import { HiddenComponent } from "./hidden/hidden.component";
import { InputComponent } from "./input/input.component";
import { materialModules } from "./material-modules";
import { NumberComponent } from "./number/number.component";
import { ParagraphComponent } from "./paragraph/paragraph.component";
import { PasswordInputComponent } from "./password/password.component";
import { PhoneInputComponent } from "./phone/phone.component";
import { DateRangeComponent } from "./range-components/date-range/date-range.component";
import { NumbersRangeComponent } from "./range-components/numbers-range/numbers-range.component";
import { RecaptchaComponent, RecaptchaDirective } from "./recaptcha/recaptcha.component";
import { ReviewScaleComponent } from "./scale-component/review-scale/review-input.component";
import { SliderComponent } from "./scale-component/slider/slider.component";
import { SelectComponent } from "./select/select.component";
import { SwitchComponent } from "./switch/switch.component";
import { ArrayInputComponent } from "./array/array-input.component";
import { TextAreaComponent } from "./text-area/text-area.component";
import { TreeComponent } from "./tree/tree.component";
import { FileBrowserComponent } from "./upload/file-browser/file-browser.component";
import { FileIconPerTypePipe } from "./upload/file-icon-per-type.pipe";
import { FileSelectComponent } from "./upload/file-select/file-select.component";
import { FileUploadService } from "./upload/file-upload.service";
import { FilesViewerComponent } from "./upload/file-viewer/file-viewer.component";
import { LocalFileInputComponent } from "./upload/local-file-input/local-file-input.component";
import { MatBtnComponent } from "@upupa/mat-btn";
import { FileTemplateComponent } from "./upload/file-viewer/file-template/file-template.component";
import { DataTableComponent } from "@upupa/table";

export const NATIVE_THEME_NAME = "native";
export const DF_NATIVE_THEME_INPUTS = {
    hidden: { component: HiddenComponent },
    paragraph: { component: ParagraphComponent },
    recaptcha: { component: RecaptchaComponent },
    text: { component: InputComponent },
    phone: {
        component: PhoneInputComponent,
        field: { inputs: { placeholder: "(xxx) xxx xx xx" } },
    },
    password: { component: PasswordInputComponent },
    number: {
        component: NumberComponent,
        field: { inputs: { type: "number" } },
    },
    "number-range": { component: NumbersRangeComponent },
    slider: { component: SliderComponent },
    reviews: { component: ReviewScaleComponent },
    email: {
        component: InputComponent,
        field: {
            inputs: { type: "email" },
            validations: [{ name: "email" }],
        },
    },
    date: { component: DateInputComponent },
    "date-range": { component: DateRangeComponent },
    select: { component: SelectComponent },
    textarea: { component: TextAreaComponent },
    file: { component: FileSelectComponent },
    "local-file": { component: LocalFileInputComponent },
    tree: { component: TreeComponent },
    radios: { component: ChoicesComponent },
    array: { component: ArrayInputComponent },
    checks: { component: ChoicesComponent },
    switch: { component: SwitchComponent },
    color: { component: ColorInputComponent },
    "autocomplete-text": { component: AutoCompleteTextComponent },
    address: { component: AddressComponent },
};

const declarations = [];

const imports = [
    ...materialModules,
    ParagraphComponent,
    ArrayInputComponent,
    UtilsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UploadModule,
    DataTableComponent,
    ScrollingModule,
    MatBtnComponent,
    ErrorsDirective,

    PhoneInputComponent,
    TextAreaComponent,
    DateInputComponent,
    SelectComponent,
    TreeComponent,
    NumberComponent,
    PasswordInputComponent,
    InputComponent,
    ChoicesComponent,
    SwitchComponent,
    ColorInputComponent,
    AutoCompleteTextComponent,
    AddressComponent,
    FileIconPerTypePipe,
    SliderComponent,
    ReviewScaleComponent,
    DateRangeComponent,
    NumbersRangeComponent,
    LocalFileInputComponent,
    FileBrowserComponent,
    FilesViewerComponent,
    FileTemplateComponent,
    FileSelectComponent,
    FileIconPerTypePipe,
    HiddenComponent,
    RecaptchaComponent,
    RecaptchaDirective,
];

@NgModule({
    imports: [...imports],
    declarations: [...declarations],
    providers: [provideHttpClient(withInterceptorsFromDi()), FileUploadService, FileIconPerTypePipe],
    exports: [...declarations, ...imports],
})
export class DynamicFormNativeThemeModule {}
