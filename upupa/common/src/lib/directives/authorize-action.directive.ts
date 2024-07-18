import { HttpClient } from "@angular/common/http";
import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, inject, Input, Renderer2 } from "@angular/core";
import { Principle, Rule, RulesManager } from "@noah-ark/common";
import { AuthService } from "@upupa/auth";
import { firstValueFrom } from "rxjs";
import { PERMISSIONS_BASE_URL } from '../tokens';
import { AuthorizeMessage, AuthorizerService } from "@noah-ark/expression-engine";

let rulesManager: RulesManager = null

@Directive({
    selector: '[authAction]',
    exportAs: 'authAction',
})
export class AuthorizeActionDirective implements AfterViewInit {
    private readonly el = inject(ElementRef).nativeElement;
    private readonly http = inject(HttpClient);
    private readonly auth = inject(AuthService);
    private readonly renderer = inject(Renderer2);
    private readonly cdRef = inject(ChangeDetectorRef);
    private readonly baseUrl = inject(PERMISSIONS_BASE_URL)
    @Input() action: string;
    @Input() path: string;
    @Input() user: Principle = this.auth.user;

    async ngAfterViewInit(): Promise<void> {
        if (!this.path) return;
        if ('disabled' in this.el) this.renderer.setProperty(this.el, 'disabled', true);
        else this.renderer.setStyle(this.el, 'display', 'none');


        if (!rulesManager) {
            const rules = await firstValueFrom(this.http.get(`${this.baseUrl}/rules`))
            const root = rules['/']
            const children = Object.values(root.children ?? {}) as Rule[]
            rulesManager = new RulesManager(root.item, children)
        }


        const authorizer = new AuthorizerService()
        const msg = { path: this.path, operation: this.action, principle: this.user }
        const rule = rulesManager.getRule(this.path, true)
        const authResult = authorizer.authorize(msg as AuthorizeMessage, rule, this.action)        
        if (authResult.access === 'deny') {
            if ('disabled' in this.el) this.renderer.setProperty(this.el, 'disabled', true);
            else this.renderer.setStyle(this.el, 'display', 'none');
        }
        else {
            if ('disabled' in this.el) this.renderer.removeAttribute(this.el, 'disabled');
            else this.renderer.setStyle(this.el, 'display', '');
        }
        this.cdRef.detectChanges();
    }
}
