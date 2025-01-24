import { NgModule, ModuleWithProviders } from "@angular/core";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { APIBASE } from "./di.token";
import { DataConfig } from "./model";
import { DOCUMENT } from "@angular/common";

@NgModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class DataModule {
    constructor() {
        // if (parentModule) {
        //   throw new Error('DataModule is already loaded. Import it in the AppModule only');
        // }
    }

    public static forChild(api_base: string, config?: DataConfig): ModuleWithProviders<DataModule> {
        return {
            ngModule: DataModule,
            providers: [
                {
                    provide: APIBASE,
                    useFactory: (doc: Document) => {
                        api_base = (api_base.length ? api_base : "/api").trim().toLocaleLowerCase();
                        if (api_base.startsWith("http")) return api_base;
                        const base = `${doc.location.protocol}//${doc.location.hostname}`;
                        return new URL(api_base ?? "/api", base).toString();
                    },
                    deps: [DOCUMENT],
                },
                {
                    provide: DataConfig,
                    useValue: config,
                },
            ],
        };
    }
}
