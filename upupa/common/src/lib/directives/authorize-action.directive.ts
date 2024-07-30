import { HttpClient } from "@angular/common/http";
import { AfterViewInit, ChangeDetectorRef, DestroyRef, Directive, ElementRef, inject, Injectable, Input, OnChanges, Renderer2, SimpleChanges } from "@angular/core";
import { AuthorizeMessage, AuthorizeResult, Permission, Principle, Rule, RulesManager } from "@noah-ark/common";
import { AuthService } from "@upupa/auth";
import { firstValueFrom, ReplaySubject } from "rxjs";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PERMISSIONS_BASE_URL } from '../tokens';
import { authorize, evaluatePermission, matchPermissions } from "@noah-ark/expression-engine";
import { TreeBranch } from "@noah-ark/path-matcher";
import { isEmpty } from "lodash";

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
    rulesManager: RulesManager = null
    readonly rules$ = new ReplaySubject<TreeBranch<Rule>>(1)
    private readonly baseUrl = inject(PERMISSIONS_BASE_URL)
    private readonly http = inject(HttpClient)

    constructor() {
        this.http.get<TreeBranch<Rule>>(`${this.baseUrl}/rules`).subscribe(rules => {
            const rootRule = rules.item
            this.rulesManager = new RulesManager(rootRule, [])
            this.rulesManager.tree = rules
            this.rules$.next(rules)
        })
    }

    buildAuthorizationMsg(path: string, action: string, principle: Principle): AuthorizeMessage {
        return { path, operation: action, principle, payload: {}, query: {} }
    }


    async authorize(path: string, action: string, principle: Principle): Promise<AuthorizeResult> {
        await firstValueFrom(this.rules$)
        if (isEmpty(action ?? '')) action = undefined

        const rule = this.rulesManager.getRule(path, true)
        const msg = this.buildAuthorizationMsg(path, action, principle)
        const authResult = authorize(msg, rule, action)
        return authResult
    }

    async matchPermissions(path: string, action: string, principle: Principle) {
        await firstValueFrom(this.rules$)
        const rule = this.rulesManager.getRule(path, true)
        const msg = this.buildAuthorizationMsg(path, action, principle)
        return matchPermissions(rule, action, { msg })
    }
}
@Directive({
    selector: '[authAction]',
    exportAs: 'authAction',
})
export class AuthorizeActionDirective implements AfterViewInit, OnChanges {

    private readonly el = inject(ElementRef);
    private readonly http = inject(HttpClient);
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
        const el = this.el.nativeElement as HTMLElement
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
        const el = this.el.nativeElement as HTMLElement
        const authResult = await this.authorizeService.authorize(path, action, principle)

        if (authResult.access === 'deny') this.deny(el)
        else this.grant(el)
    }
}
