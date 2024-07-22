import { HttpClient } from "@angular/common/http";
import { AfterViewInit, ChangeDetectorRef, DestroyRef, Directive, ElementRef, inject, Input, Renderer2 } from "@angular/core";
import { Principle, Rule, RulesManager } from "@noah-ark/common";
import { AuthService } from "@upupa/auth";
import { ReplaySubject } from "rxjs";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PERMISSIONS_BASE_URL } from '../tokens';
import { AuthorizeMessage, AuthorizerService } from "@noah-ark/expression-engine";
import { TreeBranch } from "@noah-ark/path-matcher";


let rulesManager: RulesManager = null
const rules$ = new ReplaySubject<TreeBranch<Rule>>(1)
let sub = null

@Directive({
    selector: '[authAction]',
    exportAs: 'authAction',
})
export class AuthorizeActionDirective implements AfterViewInit {
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
    async ngAfterViewInit(): Promise<void> {
        const nel = this.el.nativeElement
        this.deny(nel)
        const path = [(this.path || nel.getAttribute('path') || nel.getAttribute('data-path') || '').replace(/\/$/, '')].join('/')
        rules$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(rules => this._authorize(nel, rulesManager, path, this.action, this.user))
    }

    private deny(el: HTMLElement) {
        if ('disabled' in el)
            if (this.disableDenied === true) this.renderer.setProperty(el, 'disabled', true);
            else this.renderer.setStyle(el, 'display', 'none');

        if (this.hideDenied === true) {
            this.renderer.setStyle(el, 'display', 'none');
        }
    }
    private grant(el: HTMLElement) {
        if ('disabled' in el) this.renderer.removeAttribute(el, 'disabled');
        else this.renderer.setStyle(el, 'display', '');
    }

    private _authorize(el: HTMLElement, rulesManager: RulesManager, path: string, action: string, principle: Principle) {
        const msg = { path, operation: action, principle }
        const rule = rulesManager.getRule(path, true)
        const authResult = AuthorizerService.authorize(msg as AuthorizeMessage, rule, action)
        console.log(path, action, authResult);
        if (authResult.access === 'deny') this.deny(el)
        else this.grant(el)
        this.cdRef.detectChanges();
    }
}
