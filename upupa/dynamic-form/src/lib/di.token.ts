import { InjectionToken } from "@angular/core";
import { DynamicFormOptions } from "./dynamic-form.options";
import { DynamicComponentMapper } from "./types";

export const API_BASE = new InjectionToken<string>('ApiBaseUrl');
export const STORAGE_BASE = new InjectionToken<string>('StorageBaseUrl');
export const DYNAMIC_FORM_OPTIONS = new InjectionToken<DynamicFormOptions>('dynamic form options')

export const DEFAULT_THEME_NAME = new InjectionToken<string>('default theme name');
export const DYNAMIC_COMPONENT_MAPPER = new InjectionToken<DynamicComponentMapper>('themes inputs')
