import { Inject, Injectable, LOCALE_ID, inject } from "@angular/core";
import { Router, ActivationEnd } from "@angular/router";
import { distinctUntilChanged, filter, map, shareReplay, startWith } from "rxjs/operators";
import { BehaviorSubject, ReplaySubject } from "rxjs";
import { DEFAULT_LANG, ROUTE_VARIABLE_NAME } from "./di.token";
import { Direction, languageDir, languagesList } from "./iso.languages";
import { DOCUMENT } from "@angular/common";

@Injectable({
    providedIn: "root",
})
export class LanguageService {
    private _language: string | null = inject(LOCALE_ID);
    private readonly _language$ = new ReplaySubject<string>(1);
    readonly language$ = this._language$.asObservable().pipe(distinctUntilChanged(), shareReplay(1));

    get language(): string {
        return this._language;
    }
    set language(value: string) {
        this._language = value;
        this._language$.next(this._language);
    }

    private readonly _dir$ = new BehaviorSubject<Direction>(languageDir(this._language));
    readonly dir$ = this._dir$.asObservable().pipe(distinctUntilChanged(), shareReplay(1));

    private doc = inject(DOCUMENT);
    constructor(
        public readonly router: Router,

        @Inject(DEFAULT_LANG) public readonly defaultLang: string,
        @Inject(ROUTE_VARIABLE_NAME) public readonly routeVariableName: string,
    ) {
        if (defaultLang) this._language$.next(defaultLang);
        this.router.events.subscribe((e) => {
            if (e instanceof ActivationEnd) {
                const qlang = e.snapshot.params[routeVariableName];
                const language = qlang && this.validateLang(qlang) ? qlang : defaultLang;

                if (this._language === language) return;
                this._language = language;
                this._language$.next(this._language);
                this._dir$.next(languageDir(language));
            }
        });

        this._dir$.subscribe((dir) => {
            if (!this.doc) return;
            this.doc.dir = dir;
            this.doc.body.dir = dir;
        });
    }

    validateLang(lang: string) {
        return languagesList[lang];
    }
}
