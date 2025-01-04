import { isPlatformBrowser } from "@angular/common";
import { Component } from "@angular/core";
import { loadScript } from "@noah-ark/common";
import { GoogleIDPOptions } from "./google.idp";
import { BaseIdProviderComponent } from "../idp-base.component";

declare let google: any;

@Component({
    selector: "google-id-provider",
    standalone: true,
    template: "",
})
export class GoogleIdProviderComponent extends BaseIdProviderComponent<"google"> {
    async init() {
        if (!isPlatformBrowser(this.platformId)) return;

        this.state.emit({ state: "initializing" });

        try {
            await loadScript(this.doc, "https://accounts.google.com/gsi/client");

            const googleOptions = this.idp().options as GoogleIDPOptions;
            const options: any = {
                client_id: googleOptions.clientId,
                ...googleOptions.attributes,
            };
            if (googleOptions.attributes.ux_mode === "popup") {
                const callback = async (e) => {
                    try {
                        const res = await this.auth.signin_Google({ token: e.credential });
                        this.success.emit(res);
                    } catch (error) {
                        console.error("Error during Google Sign-In callback", error);
                        this.state.emit({ state: "error", error });
                    }
                };
                options["callback"] = async (e) => {
                    if (this.zone) {
                        this.zone.run(() => callback(e));
                    } else callback(e);
                };
            }

            google.accounts.id.initialize(options);
            this.state.emit({ state: "initialized" });
            const browserLocale = this.locale ?? "en";
            google.accounts.id.renderButton(this.host.nativeElement, {
                theme: "outline",
                size: "large",
                locale: browserLocale,
                ...googleOptions.customize,
            });
            google.accounts.id.prompt();
        } catch (error) {
            console.error(error);
            this.state.emit({ state: "error", error });
        }
    }
}
