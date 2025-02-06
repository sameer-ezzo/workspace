import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ErrorsDirective, UtilsModule } from "@upupa/common";
import { DynamicFormNativeThemeModule } from "@upupa/dynamic-form-native-theme";
import { DataTableModule } from "@upupa/table";
import { UploadModule } from "@upupa/upload";
import { MatAddressComponent } from "./address-edit/address.component";
import { MatAutoCompleteTextComponent } from "./autocomplete-text-input/autocomplete-text.component";
import { MatChipsComponent } from "./chips-input/chips-input.component";
import { MatChoicesComponent } from "./choices/choices.component";
import { MatColorInputComponent } from "./color-input/color-input.component";
import { MatDateInputComponent } from "./date-input/date-input.component";
import { HiddenInputComponent, MatInputComponent } from "./input/input.component";
import { materialModules } from "./material-modules";
import { MatNumberComponent } from "./number/number.component";
import { MatPasswordInputComponent } from "./password/password.component";
import { MatPhoneInputComponent } from "./phone/phone.component";
import { MatDateRangeComponent } from "./range-components/date-range/date-range.component";
import { MatNumbersRangeComponent } from "./range-components/numbers-range/numbers-range.component";
import { MatReviewScaleComponent } from "./scale-component/review-scale/review-input.component";
import { MatSliderComponent } from "./scale-component/slider/slider.component";
import { MatSelectComponent } from "./select/select.component";
import { MatSwitchComponent } from "./switch/switch.component";
import { MatArrayInputComponent } from "./array/array-input.component";
import { MatTextAreaComponent } from "./text-area/text-area.component";
import { MatTreeComponent } from "./tree/tree.component";

import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from "@angular/material/form-field";
import { MatCalendarInputComponent } from "./calendar-input/calendar-input.component";

export const DF_MATERIAL_THEME_INPUTS = {
    text: { component: MatInputComponent },
    hidden: { component: HiddenInputComponent },
    phone: {
        component: MatPhoneInputComponent,
        field: { inputs: { placeholder: "(xxx) xxx xx xx" } },
    },
    password: { component: MatPasswordInputComponent },
    number: {
        component: MatNumberComponent,
        field: { inputs: { type: "number" } },
    },
    "number-range": { component: MatNumbersRangeComponent },
    slider: { component: MatSliderComponent },
    reviews: { component: MatReviewScaleComponent },
    email: {
        component: MatInputComponent,
        field: {
            inputs: { type: "email" },
            validations: [{ name: "email" }],
        },
    },
    date: { component: MatDateInputComponent },
    calendar: { component: MatCalendarInputComponent },
    "date-range": { component: MatDateRangeComponent },
    select: { component: MatSelectComponent },
    textarea: { component: MatTextAreaComponent },
    // file: { component: MatFileSelectComponent },
    // 'local-file': { component: MatLocalFileInputComponent },
    tree: { component: MatTreeComponent },
    radios: {
        component: MatChoicesComponent,
        field: {
            inputs: { maxAllowed: 1 },
        },
    },
    array: { component: MatArrayInputComponent },
    table: { component: MatArrayInputComponent },
    checks: {
        component: MatChoicesComponent,
        field: {
            inputs: { maxAllowed: 1000 },
        },
    },
    switch: { component: MatSwitchComponent },
    color: { component: MatColorInputComponent },
    chips: { component: MatChipsComponent },
    "autocomplete-text": { component: MatAutoCompleteTextComponent },
    address: { component: MatAddressComponent },
};

const declarations = [];

const imports = [
    ...materialModules,
    UtilsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UploadModule,
    DynamicFormNativeThemeModule,
    MatArrayInputComponent,
    MatSwitchComponent,
    DataTableModule,
    ScrollingModule,
    ErrorsDirective,

    MatPhoneInputComponent,
    MatTextAreaComponent,
    MatDateInputComponent,
    MatSelectComponent,
    MatTreeComponent,
    MatNumberComponent,
    MatChipsComponent,
    MatPasswordInputComponent,
    MatInputComponent,
    MatChoicesComponent,
    MatColorInputComponent,
    MatAutoCompleteTextComponent,
    MatAddressComponent,
    MatSliderComponent,
    MatReviewScaleComponent,
    MatDateRangeComponent,
    MatNumbersRangeComponent,
    // FileIconPerTypePipe,
    // MatAttachmentsComponent, MatLocalFileInputComponent, MatFileBrowserComponent,
    // MatFilesViewerComponent, MatFileSelectComponent, FileIconPerTypePipe,
    // MatFileInputComponent
];

@NgModule({
    imports: [...imports],
    declarations: [...declarations],
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        // FileUploadService,
        // FileIconPerTypePipe
        {
            provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
            useValue: { appearance: "outline" },
        },
    ],
    exports: [...declarations, ...imports],
})
export class DynamicFormMaterialThemeModule {}
