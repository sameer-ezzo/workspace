import { Injectable, Inject, Optional, inject } from "@angular/core";
import { Observable, Subject, firstValueFrom, of } from "rxjs";
import { LanguageService } from "./language.service";
import { filter, shareReplay, switchMap } from "rxjs/operators";
import { LanguagesDictionary, DICTIONARIES_URL, SHOW_LOGS } from "./di.token";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: "root" })
export class TranslateService {
    private translation_change = new Subject<string>();

    dictionaryLoaded$ = new Subject<any>();
    private readonly http = inject(HttpClient);
    constructor(
        public language_service: LanguageService,
        private dictionary: LanguagesDictionary,
        @Inject(DICTIONARIES_URL) private dictionariesUrl: string,
        @Optional() @Inject(SHOW_LOGS) private showLogs = false,
    ) {
        this.language_service.language$.pipe(filter((lang) => !lang)).subscribe((lang) => {
            this.get_dictionary(lang);
        });
    }

    cache = new Map<string, Observable<string>>();
    translate$(key: string, ...params: string[]): Observable<string> {
        //todo this is calling same code multiple time
        if (!this.cache.has(key)) {
            const _$ = this.language_service.language$.pipe(
                switchMap((l) => this._translate$(l, key, ...params)),
                shareReplay(1),
            );
            this.cache.set(key, _$);
        }

        return this.cache.get(key) ?? of(key);
    }

    private _translate$(language: string, key: string, ...params: string[]) {
        return new Observable<string>((observer) => {
            observer.next(this.translate(key, language, ...params));
            if (!this._loaded[language]) {
                this.get_dictionary(language).then(() => {
                    observer.next(this.translate(key, language, ...params));
                });
            }
        });
    }

    translate(key: string, lang: string | undefined = undefined, ...params: string[]): string {
        let result = key;

        if (!lang) {
            lang = this.language_service.language;
        }

        if (lang && key && this.dictionary[lang]) {
            const translation = this.dictionary[lang][key];
            if (translation) {
                result = translation;
            }
        }

        if (this.showLogs) console.warn(`No translation FOR: '${key}' INTO: ${lang}`);
        if (params && params.length) {
            params.forEach((p, i) => {
                const wild = `$${i}`;
                const wildIndex = result.indexOf(wild);
                if (wildIndex > -1) {
                    if (result[wildIndex + wild.length] === ".") {
                        let property = "";
                        for (let k = wildIndex + wild.length + 1; k < result.length; k++) {
                            if (result[k] === " ") break;
                            property += result[k];
                        }
                        result = result.replace("$" + i + "." + property, p[property]);
                    } else result = result.replace("$" + i, p);
                }
            });
        }

        return result;
    }

    private _loaded: { [lang: string]: Promise<any> } = {};
    private async get_dictionary(lang: string): Promise<any> {
        return this._loaded[lang] ?? {};
        if (this._loaded[lang]) return this._loaded[lang];

        if (!this.dictionariesUrl) {
            this.dictionary[lang] = {};
            this._loaded[lang] = Promise.resolve({});
            return this._loaded[lang];
        }

        this._loaded[lang] = new Promise(async (resolve) => {
            const url = `${this.dictionariesUrl}/${lang}.json`;
            let dictionary = {};
            try {
                dictionary = await firstValueFrom(this.http.get(url));
            } catch (error) {
                console.error("Error fetching dictionary", error);
            }

            this.dictionaryLoaded$.next(dictionary);
            this.dictionary[lang] = dictionary;
            resolve(dictionary);
        });

        return this._loaded[lang];
    }
}
