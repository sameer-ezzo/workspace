import { InjectionToken } from "@angular/core";

export const DEFAULT_LANG = new InjectionToken<string>('DefaultLanguage');
export const DICTIONARIES_URL = new InjectionToken<string>('DictionariesUrl');
export const ROUTE_VARIABLE_NAME = new InjectionToken<string>('RouteVariableName');
export const SHOW_LOGS = new InjectionToken<string>('ShowLogs');


export class LanguagesDictionary { [lang: string]: LanguageDictionary };
export type LanguageDictionary = { [word: string]: string };