import { HttpClient } from "@angular/common/http";
import { AfterViewInit, ChangeDetectorRef, DestroyRef, Directive, ElementRef, inject, Input, OnChanges, Renderer2, SimpleChanges } from "@angular/core";
import { Permission, Principle } from "@noah-ark/common";
import { AuthService } from "@upupa/auth";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthorizationService } from "./authorization.service";

@Directive({
    selector: '[authAction]',
    exportAs: 'authAction'
})
export class AuthorizeActionDirective implements AfterViewInit, OnChanges {

    private readonly hostElement = inject(ElementRef);
    private readonly auth = inject(AuthService);
    private readonly renderer = inject(Renderer2);
    private readonly cdRef = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef)
    private readonly authorizeService = inject(AuthorizationService)
    @Input() action: string;
    @Input() path: string;
    @Input() user: Principle = this.auth.user;

    @Input() disableDenied = true;
    @Input() hideDenied = false;



    initialized = false
    ngOnChanges(changes: SimpleChanges) {
        if (this.initialized) {
            this._authorize(this.path, this.action, this.user)
        }
    }


    originalDisplay = ''
    originalState = false
    ngAfterViewInit(): void {
        const el = this.hostElement.nativeElement as HTMLElement
        this.originalDisplay = el.style.display
        this.originalState = el['disabled'] === true

        this.authorizeService.rules$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(rules => {
            this._authorize(this.path, this.action, this.user);
            this.initialized = true;
        });
    }
    private deny(el: HTMLElement) {

        if (this.disableDenied === true) if ('disabled' in el) this.renderer.setProperty(el, 'disabled', true);
        else this.renderer.setStyle(el, 'display', 'none');

        if (this.hideDenied === true) {
            this.renderer.setStyle(el, 'display', 'none');
        }
        this.cdRef.detectChanges();
    }
    private grant(el: HTMLElement) {
        if (this.originalState === true) this.renderer.setAttribute(el, 'disabled', 'true');
        else this.renderer.removeAttribute(el, 'disabled');

        this.renderer.setStyle(el, 'display', this.originalDisplay);
        this.cdRef.detectChanges();
    }

    private async _authorize(path: string, action: string, principle: Principle) {
        if (!(path??'').trim().length) return
        const el = this.hostElement.nativeElement as HTMLElement
        const authResult = await this.authorizeService.authorize(path, action, principle)

        if (authResult.access === 'deny')
            this.deny(el)
        else
            this.grant(el)
    }
}
