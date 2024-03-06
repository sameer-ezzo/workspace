import { Injectable, Inject, Optional } from '@angular/core'
import { Observable, Subject, firstValueFrom, of } from 'rxjs'
import { LanguageService } from './language.service'
import { filter, shareReplay, switchMap } from 'rxjs/operators'
import { LanguagesDictionary, DICTIONARIES_URL, SHOW_LOGS } from './di.token'
import { HttpClient } from '@angular/common/http'

@Injectable({ providedIn: 'root' })
export class TranslateService {

    private translation_change = new Subject<string>()

    dictionaryLoaded$ = new Subject<any>()

    constructor(
        public language_service: LanguageService,
        public http: HttpClient,
        private dictionary: LanguagesDictionary,
        @Inject(DICTIONARIES_URL) private dictionariesUrl: string,
        @Optional() @Inject(SHOW_LOGS) private showLogs = false) {

        this.language_service.language$.pipe(filter(lang => !lang))
            .subscribe(lang => { this.get_dictionary(lang) })
    }

    cache = new Map<string, Observable<string>>()
    translate$(key: string, ...params: string[]): Observable<string> { //todo this is calling same code multiple time
        if (!this.cache.has(key)) {

            const _$ = this.language_service.language$.pipe(
                switchMap(l => this._translate$(l, key, ...params)),
                shareReplay(1)
            )
            this.cache.set(key, _$)
        }

        return this.cache.get(key) ?? of(key)
    }

    private _translate$(language: string, key: string, ...params: string[]) {
        return new Observable<string>((observer) => {
            observer.next(this.translate(key, language, ...params))
            if (!this._loaded[language]) {
                this.get_dictionary(language).then(() => {
                    observer.next(this.translate(key, language, ...params))
                })
            }

        })
    }



    translate(key: string, lang: string | undefined = undefined, ...params: string[]): string {
        let result = key

        if (!lang) { lang = this.language_service.language }

        if (lang && key && this.dictionary[lang]) {
            const translation = this.dictionary[lang][key]
            if (translation) { result = translation }
        }

        if (this.showLogs) console.warn(`No translation FOR: '${key}' INTO: ${lang}`)
        if (params && params.length) {

            params.forEach((p, i) => {
                const wild = `$${i}`
                const wildIndex = result.indexOf(wild)
                if (wildIndex > -1) {
                    if (result[wildIndex + wild.length] === '.') {
                        let property = ''
                        for (let k = wildIndex + wild.length + 1; k < result.length; k++) {
                            if (result[k] === ' ') break
                            property += result[k]
                        }
                        result = result.replace('$' + i + '.' + property, p[property])
                    }
                    else result = result.replace('$' + i, p)
                }

            })
        }

        return result
    }

    private _loaded: { [lang: string]: boolean } = {}
    private async get_dictionary(lang: string): Promise<void> {

        if (this._loaded[lang]) { return }
        if (!this.dictionariesUrl) {
            this.dictionary[lang] = {}
            this._loaded[lang] = true
            return
        }

        const dic = await firstValueFrom(this.http.get(`${this.dictionariesUrl}/${lang}.json`))
        this.dictionaryLoaded$.next(dic)
        this.dictionary[lang] = <any>dic
        this._loaded[lang] = true
    }
}


/*
sources = [placeHolder$, dictionary$]

dictionary$ = (lang) =>

index$.switchMap((idx) => sources[idx])
*/