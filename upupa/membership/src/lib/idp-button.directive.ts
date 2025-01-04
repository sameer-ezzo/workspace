import { ElementRef, inject, Directive, PLATFORM_ID, input, SimpleChanges, computed, output, Injector } from "@angular/core";

import { IdPsOptions } from "@upupa/auth";
import { IdpName } from "./types";
import { isPlatformBrowser } from "@angular/common";

@Directive({
    selector: "[idp-button]",
    exportAs: "idpButton",
    standalone: true,
})
export class IdpButtonDirective {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly host = inject(ElementRef).nativeElement;

    idp = input.required<Partial<IdPsOptions>>();
    idpName = computed(() => this.idp().name as IdpName);
    idpOptions = computed(() => this.idp().options);

    state = output<{ state: "initialized" } | { state: "initializing" } | { state: "error"; error: any }>();
    success = output<any>();

    ngOnChanges(changes: SimpleChanges) {
        if (changes["idp"]) {
            this.init();
        }
    }
    private readonly injector = inject(Injector);
    private async init() {
        if (!isPlatformBrowser(this.platformId)) return;
        if (this.idpName() === "google") {
            // runInInjectionContext(this.injector, () => {
            //     const google = new GoogleIdProvider(this.host, this.idp() as unknown as IdPsOptions<"google">);
            // });
        }
        throw new Error(`IdP ${this.idpName()} is not supported`);
    }
}
