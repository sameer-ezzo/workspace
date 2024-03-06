import { ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { DynamicFormComponent } from './dynamic-form.component';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';
import { LanguageModule, TranslationModule } from '@upupa/language';

import { FocusLeaveDirective } from './focusleave.dir';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CollectorComponent } from './collector/collector.component';
import { MatBtnModule, UtilsModule } from '@upupa/common';
import { TaskValidationComponent } from './task.validation.component/task.validation.component';
import { DEFAULT_THEME_NAME, DYNAMIC_COMPONENT_MAPPER, DYNAMIC_FORM_OPTIONS } from './di.token';
import { DynamicFormThemes } from './dynamic-form-themes.type';
import { DynamicFieldDirective } from './dynamic-field.directive';
import { DF_NATIVE_THEME_INPUTS, DynamicFormNativeThemeModule, NATIVE_THEME_NAME } from '@upupa/dynamic-form-native-theme'
import { DynamicFormOptions } from './dynamic-form.options';

const nativeTheme = {
    [NATIVE_THEME_NAME]: DF_NATIVE_THEME_INPUTS
} as unknown as DynamicFormThemes

const declarations = [
    DynamicFormComponent,
    CollectorComponent,
    FocusLeaveDirective,
    DynamicFieldDirective,
    TaskValidationComponent
];

@NgModule({
    declarations: [...declarations],
    imports: [
        CommonModule,
        HttpClientModule,
        MatBtnModule,
        FormsModule,
        ReactiveFormsModule,
        LanguageModule,
        TranslationModule,
        ScrollingModule,
        DynamicFormNativeThemeModule,
        UtilsModule
    ],
    providers: [
        { provide: DEFAULT_THEME_NAME, useValue: NATIVE_THEME_NAME },
        { provide: DYNAMIC_COMPONENT_MAPPER, useValue: { NATIVE_THEME_NAME: DF_NATIVE_THEME_INPUTS } },
        { provide: DYNAMIC_FORM_OPTIONS, useValue: { enableLogs: false } }
    ],
    exports: [...declarations, ScrollingModule],
    bootstrap: [DynamicFormComponent]
})
export class DynamicFormModule {
    static forRoot(providers?: Provider[],
        themes?: DynamicFormThemes,
        defaultThemeName?: 'native' | string,
        options: DynamicFormOptions = { enableLogs: false }):
        ModuleWithProviders<DynamicFormModule> {
        defaultThemeName ??= NATIVE_THEME_NAME
        themes = { ...nativeTheme, ...themes }
        return {
            ngModule: DynamicFormModule,
            providers: [...providers,
            { provide: DEFAULT_THEME_NAME, useValue: defaultThemeName },
            { provide: DYNAMIC_COMPONENT_MAPPER, useValue: themes },
            { provide: DYNAMIC_FORM_OPTIONS, useValue: options }
            ]
        }
    }
}