import { makeEnvironmentProviders, Provider } from "@angular/core";
import { DEFAULT_THEME_NAME, DYNAMIC_COMPONENT_MAPPER } from "./di.token";
import { DynamicFormThemes } from "./dynamic-form-themes.type";

export function provideDynamicForm(providers?: Provider[], themes?: DynamicFormThemes, defaultThemeName?: "native" | string) {
    return makeEnvironmentProviders([...providers, { provide: DEFAULT_THEME_NAME, useValue: defaultThemeName }, { provide: DYNAMIC_COMPONENT_MAPPER, useValue: themes }]);
}
