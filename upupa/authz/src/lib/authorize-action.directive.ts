import { AfterViewInit, ChangeDetectorRef, DestroyRef, Directive, ElementRef, inject, OnChanges, Renderer2, SimpleChanges, input, computed, effect } from "@angular/core";
import { AuthorizeResult, Principle } from "@noah-ark/common";
import { AuthService } from "@upupa/auth";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { AuthorizationService } from "./authorization.service";

const authzCache0 = new Map<string, AuthorizeResult>();

@Directive({
    selector: "[authAction]",
    exportAs: "authAction",
    standalone: true,
})
export class AuthorizeActionDirective implements AfterViewInit, OnChanges {
    private readonly hostElement = inject(ElementRef);
    private readonly auth = inject(AuthService);
    private readonly renderer = inject(Renderer2);
    private readonly cdRef = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    private readonly authorizeService = inject(AuthorizationService);
    readonly action = input<string>(undefined);
    readonly path = input<string>(undefined);
    readonly user = input<Principle>(this.auth.user);

    readonly disableDenied = input(true);
    readonly hideDenied = input(false);

    initialized = false;
    ngOnChanges(changes: SimpleChanges) {
        if (this.initialized) {
            this._authorize(this.path(), this.action(), this.user());
        }
    }

    originalDisplay = "";
    originalState = false;
    ngAfterViewInit(): void {
        const el = this.hostElement.nativeElement as HTMLElement;
        this.originalDisplay = el.style.display;
        this.originalState = el["disabled"] === true;

        this.authorizeService.rules$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((rules) => {
            this._authorize(this.path(), this.action(), this.user());
            this.initialized = true;
        });
    }
    private deny(el: HTMLElement) {
        if (this.disableDenied() === true)
            if ("disabled" in el) this.renderer.setProperty(el, "disabled", true);
            else this.renderer.setStyle(el, "display", "none");

        if (this.hideDenied() === true) {
            this.renderer.setStyle(el, "display", "none");
        }
        this.cdRef.detectChanges();
    }
    private grant(el: HTMLElement) {
        if (this.originalState === true) this.renderer.setAttribute(el, "disabled", "true");
        else this.renderer.removeAttribute(el, "disabled");

        this.renderer.setStyle(el, "display", this.originalDisplay);
        this.cdRef.detectChanges();
    }

    private async _authorize(path: string, action: string, principle: Principle) {
        const el = this.hostElement.nativeElement as HTMLElement;

        if (!(path ?? "").trim().length) {
            this.grant(el);
            return;
        }
        const authResult = authzCache0.get(`${action}:${path}`) ?? (await this.authorizeService.authorize(path, action, principle));
        authzCache0.set(`${action}:${path}`, authResult);

        if (authResult.access === "deny") this.deny(el);
        else this.grant(el);
    }
}

const authzCache = new Map<string, AuthorizeResult>();
@Directive({
    selector: "[authz]",
    standalone: true,
})
export class AuthzDirective implements AfterViewInit, OnChanges {
    private readonly hostElement = inject(ElementRef);
    private readonly auth = inject(AuthService);
    private readonly renderer = inject(Renderer2);
    private readonly cdRef = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    private readonly authorizeService = inject(AuthorizationService);

    readonly authz = input<string>(undefined);
    readonly user = input<Principle>(this.auth.user);

    constructor() {
        effect(() => {
            const user = this.user();
            authzCache.clear();
        });
    }

    readonly segments = computed(() => {
        const segments = this.authz()?.split(":") ?? [undefined, undefined];
        return segments.length === 1 ? [undefined, segments[0]] : segments;
    });

    readonly action = computed(() => this.segments()[0]);
    readonly path = computed(() => {
        const path = this.segments()[1];
        if (path && !path.startsWith("/")) console.error(`Path:${path} must start with /`, this.hostElement.nativeElement);
        return path;
    });

    initialized = false;
    ngOnChanges(changes: SimpleChanges) {
        if (this.initialized) {
            this._authorize(this.path(), this.action(), this.user());
        }
    }

    originalDisplay = "";
    originalState = false;
    ngAfterViewInit(): void {
        const el = this.hostElement.nativeElement as HTMLElement;
        this.originalDisplay = el.style.display;
        this.originalState = el["disabled"] === true;

        this.authorizeService.rules$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((rules) => {
            this._authorize(this.path(), this.action(), this.user());
            this.initialized = true;
        });
    }
    private deny(el: HTMLElement) {
        // if (this.disableDenied() === true)
        //     if ("disabled" in el) this.renderer.setProperty(el, "disabled", true);
        //     else this.renderer.setStyle(el, "display", "none");

        // if (this.hideDenied() === true) {
        this.renderer.setStyle(el, "display", "none");
        // }
        this.cdRef.detectChanges();
    }
    private grant(el: HTMLElement) {
        if (this.originalState === true) this.renderer.setAttribute(el, "disabled", "true");
        else this.renderer.removeAttribute(el, "disabled");

        this.renderer.setStyle(el, "display", this.originalDisplay);
        this.cdRef.detectChanges();
    }

    private async _authorize(path: string, action: string, principle: Principle) {
        const el = this.hostElement.nativeElement as HTMLElement;
        if (!(path ?? "").trim().length) {
            this.grant(el);
            return;
        }

        const authResult = authzCache.get(this.authz()) ?? (await this.authorizeService.authorize(path, action, principle));
        authzCache.set(this.authz(), authResult);

        if (authResult.access === "deny") this.deny(el);
        else this.grant(el);
    }
}

@Directive({
    selector: "[hasRole]",
    host: {
        "[style.visibility]": "_hasRole() ?  'visible' : 'hidden'",
    },
})
export class HasRoleDirective {
    auth = inject(AuthService);
    host = inject(ElementRef);
    hasRole = input<string[], string | string[]>(undefined, { transform: (value) => (typeof value === "string" ? [value] : value) });

    _hasRole = computed(() => {
        const requiredRoles = this.hasRole() ?? [];
        return requiredRoles.some((r) => this.auth.hasRole(r));
    });
}
