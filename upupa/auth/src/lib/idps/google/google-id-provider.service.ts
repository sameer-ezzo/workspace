import { DOCUMENT, isPlatformBrowser } from "@angular/common";
import { inject, Injectable, InjectionToken, LOCALE_ID, NgZone, PLATFORM_ID } from "@angular/core";
import { IdPName, IdProviderOptions } from "../types";
import { loadScript } from "@noah-ark/common";

declare let google: any;

export abstract class IdProviderService<Name extends IdPName> {
    get IdpName(): IdPName | undefined {
        return undefined;
    }
    get canRender(): boolean {
        return false;
    }
    abstract render?(el: HTMLElement, cb: (e) => void): Promise<any>;
    abstract signin(options?: IdProviderOptions<Name>): Promise<{ token: string }>;
}

export const GOOGLE_ID_PROVIDER_OPTIONS = new InjectionToken<IdProviderOptions<"google">>("GOOGLE_ID_PROVIDER_OPTIONS");

@Injectable()
export class GoogleIdProviderService implements IdProviderService<"google"> {
    get IdpName(): IdPName {
        return "google";
    }

    get canRender(): boolean {
        return !!this.options.options.customize;
    }

    private readonly zone = inject(NgZone);
    private readonly options = inject(GOOGLE_ID_PROVIDER_OPTIONS);
    private readonly locale =
        (inject(LOCALE_ID, { optional: true }) ?? isPlatformBrowser(inject(PLATFORM_ID))) ? (typeof navigator !== "undefined" ? navigator.language : null) : null;
    private credentials: any = null;

    private readonly doc = inject(DOCUMENT);
    private readonly platformId = inject(PLATFORM_ID);
    constructor() {}

    async render(el: HTMLElement, cb: (e) => void): Promise<any> {
        const browserLocale = this.locale;

        await this.init(cb); // Ensure Google API is initialized

        google.accounts.id.renderButton(el, {
            theme: "outline",
            size: "large",
            locale: browserLocale,
            ...this.options.options.customize,
        });
    }

    private async init(cb?: (e) => void): Promise<void> {
        const locale = (this.locale ?? isPlatformBrowser(this.platformId)) ? navigator.language : null;
        await loadScript(this.doc, `https://accounts.google.com/gsi/client?${locale ? "hl=" + locale : ""}`);

        const googleOptions = { ...this.options.options };

        const initOptions = {
            client_id: googleOptions.client_id,
            ...googleOptions.attributes,
            callback: (response: any) => {
                cb
                    ? cb(response)
                    : this.zone.run(() => {
                          this.credentials = response;
                      });
            },
        };

        google.accounts.id.initialize(initOptions);
    }

    private async oneTapPrompt(): Promise<any> {
        await this.init(); // Ensure initialization

        return new Promise((resolve, reject) => {
            google.accounts.id.prompt((notification) => {
                const { g, i } = notification;

                if (g === "dismissed" && i !== "flow_restarted") {
                    resolve(this.credentials);
                } else if (g === "skipped") {
                    reject("User skipped the one-tap prompt.");
                }
            });
        });
    }

    async signin(options?: IdProviderOptions<"google">): Promise<any> {
        return this.oneTapPrompt();
    }
}
