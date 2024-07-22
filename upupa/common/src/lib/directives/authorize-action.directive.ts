import { HttpClient } from "@angular/common/http";
import { AfterViewInit, ChangeDetectorRef, DestroyRef, Directive, ElementRef, inject, Input, OnChanges, Renderer2, SimpleChanges } from "@angular/core";
import { Principle, Rule, RulesManager } from "@noah-ark/common";
import { AuthService } from "@upupa/auth";
import { ReplaySubject } from "rxjs";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PERMISSIONS_BASE_URL } from '../tokens';
import { AuthorizeMessage, AuthorizerService } from "@noah-ark/expression-engine";
import { TreeBranch } from "@noah-ark/path-matcher";
import { isEmpty } from "lodash";


let rulesManager: RulesManager = null
const rules$ = new ReplaySubject<TreeBranch<Rule>>(1)
let sub = null

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
    private readonly baseUrl = inject(PERMISSIONS_BASE_URL)
    private readonly destroyRef = inject(DestroyRef)
    @Input() action: string;
    @Input() path: string;
    @Input() user: Principle = this.auth.user;

    @Input() disableDenied = true;
    @Input() hideDenied = false;

    ngOnInit() {
        if (!sub) sub = this.http.get<TreeBranch<Rule>>(`${this.baseUrl}/rules`).subscribe(rules => {
            const rootRule = rules.item
            rulesManager = new RulesManager(rootRule, [])
            rulesManager.tree = rules
            rules$.next(rules)
        })

    }

    initialized = false
    ngOnChanges(changes: SimpleChanges) {
        if (this.initialized) {
            this._authorize(rulesManager, this.path, this.action, this.user)
        }
    }

    originalDisplay = ''
    originalState = false
    ngAfterViewInit(): void {
        const el = this.el.nativeElement as HTMLElement
        this.originalDisplay = el.style.display
        this.originalState = el['disabled'] === true

        rules$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(rules => {
            this._authorize(rulesManager, this.path, this.action, this.user);
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

    private _authorize(rulesManager: RulesManager, path: string, action: string, principle: Principle) {
        const el = this.el.nativeElement as HTMLElement
        if (isEmpty(action ?? '')) return this.grant(el)

        const msg = { path, operation: action, principle }
        const rule = rulesManager.getRule(path, true)
        const authResult = AuthorizerService.authorize(msg as AuthorizeMessage, rule, action)
        if (authResult.access === 'deny') this.deny(el)
        else this.grant(el)
    }
}
