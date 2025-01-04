import { DOCUMENT } from "@angular/common";
import { Component, computed, ElementRef, inject, Injector, input, LOCALE_ID, NgZone, output, PLATFORM_ID, SimpleChanges } from "@angular/core";
import { AuthService } from "../auth.service";
import { IdPName, IdPsOptions } from "./types";

@Component({
    selector: "base-id-provider",
    standalone: true,
    template: "",
})
export abstract class BaseIdProviderComponent<Name extends IdPName> {
    protected readonly host = inject(ElementRef);
    protected readonly platformId = inject(PLATFORM_ID);
    protected readonly injector = inject(Injector);
    protected readonly doc = inject(DOCUMENT);
    protected readonly auth = inject(AuthService);
    protected readonly locale = inject(LOCALE_ID, { optional: true }) ?? "en";
    idp = input.required<IdPsOptions<Name>>();
    idpName = computed(() => this.idp().name as IdPName);
    idpOptions = computed(() => this.idp().options);
    state = output<{ state: "initialized" } | { state: "initializing" } | { state: "error"; error: any }>();
    success = output<any>();
    zone = inject(NgZone, { optional: true });
    abstract init(): void;

    ngOnChanges(changes: SimpleChanges) {
        if (changes["idp"]) {
            this.init();
        }
    }
}
