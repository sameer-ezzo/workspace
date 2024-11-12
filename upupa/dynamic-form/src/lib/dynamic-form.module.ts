import { ModuleWithProviders, NgModule, Provider } from '@angular/core';
import { DynamicFormComponent, OrderedKeyValuePipe } from './dynamic-form.component';
import { DynamicFormFieldComponent } from './dynamic-form-field.component';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FocusLeaveDirective } from './focusleave.dir';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CollectorComponent } from './collector/collector.component';
import { PortalComponent, UtilsModule } from '@upupa/common';
import { TaskValidationComponent } from './task.validation.component/task.validation.component';
import { DEFAULT_THEME_NAME, DYNAMIC_COMPONENT_MAPPER, DYNAMIC_FORM_OPTIONS } from './di.token';
import { DynamicFormThemes } from './dynamic-form-themes.type';
import { DF_NATIVE_THEME_INPUTS, DynamicFormNativeThemeModule, NATIVE_THEME_NAME } from '@upupa/dynamic-form-native-theme';
import { DynamicFormModuleOptions } from './dynamic-form.options';
import { MatBtnComponent } from '@upupa/mat-btn';


const nativeTheme = {
    [NATIVE_THEME_NAME]: DF_NATIVE_THEME_INPUTS,
} as unknown as DynamicFormThemes;

const declarations = [DynamicFormComponent, CollectorComponent, FocusLeaveDirective, TaskValidationComponent, OrderedKeyValuePipe];

@NgModule({
    declarations: [...declarations],
    exports: [...declarations, DynamicFormFieldComponent, ScrollingModule],
    bootstrap: [DynamicFormComponent],
    imports: [
        CommonModule,
        UtilsModule,
        FormsModule,
        ReactiveFormsModule,
        ScrollingModule,
        DynamicFormNativeThemeModule,
        MatBtnComponent,
        PortalComponent,
        DynamicFormFieldComponent,
    ],
    providers: [
        { provide: DEFAULT_THEME_NAME, useValue: NATIVE_THEME_NAME },
        {
            provide: DYNAMIC_COMPONENT_MAPPER,
            useValue: { NATIVE_THEME_NAME: DF_NATIVE_THEME_INPUTS },
        },
        { provide: DYNAMIC_FORM_OPTIONS, useValue: { enableLogs: false } },
        // provideHttpClient(withInterceptorsFromDi()),
    ],
})
export class DynamicFormModule {
    static forRoot(
        providers?: Provider[],
        themes?: DynamicFormThemes,
        defaultThemeName?: 'native' | string,
        options: DynamicFormModuleOptions = { enableLogs: false }
    ): ModuleWithProviders<DynamicFormModule> {
        defaultThemeName ??= NATIVE_THEME_NAME;
        themes = { ...nativeTheme, ...themes };
        return {
            ngModule: DynamicFormModule,
            providers: [
                ...providers,
                { provide: DEFAULT_THEME_NAME, useValue: defaultThemeName },
                { provide: DYNAMIC_COMPONENT_MAPPER, useValue: themes },
                { provide: DYNAMIC_FORM_OPTIONS, useValue: options },
            ],
        };
    }
}
