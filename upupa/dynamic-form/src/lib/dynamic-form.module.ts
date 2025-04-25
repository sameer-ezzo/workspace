import { makeEnvironmentProviders, Provider } from "@angular/core";
import { DEFAULT_THEME_NAME, DYNAMIC_COMPONENT_MAPPER, DYNAMIC_FORM_OPTIONS } from "./di.token";
import { DynamicFormThemes } from "./dynamic-form-themes.type";
import { DynamicFormModuleOptions } from "./dynamic-form.options";

export function provideDynamicForm(
    providers?: Provider[],
    themes?: DynamicFormThemes,
    defaultThemeName?: "native" | string,
    options: DynamicFormModuleOptions = { enableLogs: false },
) {
    return makeEnvironmentProviders([
        ...providers,
        { provide: DEFAULT_THEME_NAME, useValue: defaultThemeName },
        { provide: DYNAMIC_COMPONENT_MAPPER, useValue: themes },
        { provide: DYNAMIC_FORM_OPTIONS, useValue: options },
    ]);
}
