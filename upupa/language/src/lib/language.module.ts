import { BidiModule } from "@angular/cdk/bidi";
import { NgModule, ModuleWithProviders } from "@angular/core";
import { DEFAULT_LANG, DICTIONARIES_URL, LanguagesDictionary, ROUTE_VARIABLE_NAME, SHOW_LOGS } from "./di.token";
import { TextPipe } from "./text.pipe";

@NgModule({
    declarations: [],
    imports: [BidiModule],
    exports: [BidiModule],
})
export class LanguageModule {
    public static forRoot(
        defaultLang: string,
        dictionaries: LanguagesDictionary,
        routeVariableName = "lang",
        dictionariesUrl?: string,
        showLogs = false,
    ): ModuleWithProviders<LanguageModule> {
        return {
            ngModule: LanguageModule,
            providers: [
                TextPipe,
                {
                    provide: DEFAULT_LANG,
                    useValue: defaultLang,
                },
                {
                    provide: ROUTE_VARIABLE_NAME,
                    useValue: routeVariableName,
                },
                {
                    provide: LanguagesDictionary,
                    useValue: dictionaries,
                },
                {
                    provide: DICTIONARIES_URL,
                    useValue: dictionariesUrl,
                },
                {
                    provide: SHOW_LOGS,
                    useValue: showLogs,
                },
            ],
        };
    }
}

@NgModule({
    declarations: [],
    imports: [BidiModule, TextPipe],
    exports: [TextPipe],
})
export class TranslationModule {}
