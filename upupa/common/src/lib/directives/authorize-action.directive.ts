import { HttpClient } from "@angular/common/http";
import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, inject, Input, Renderer2 } from "@angular/core";
import { Principle } from "@noah-ark/common";
import { AuthService } from "@upupa/auth";
import { firstValueFrom } from "rxjs";
import { PERMISSIONS_BASE_URL } from '../tokens';

const rules = new Map<string, any>()

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
        if (!this.user) this.renderer.setStyle(this.el, 'display', 'none');
        const userId = this.user?.sub;
        let rs = rules.get(userId)
        if (!rs) {
            rs = await firstValueFrom(this.http.get<any[]>(`${this.baseUrl}/user-permissions/${userId}`))
            rules.set(userId, rs)
        }
        if (!rs || rs.length === 0) return;

        const roles = this.user?.roles ?? [];
        if (roles.length === 0)
            if ('disabled' in this.el) this.renderer.setProperty(this.el, 'disabled', true);
            else this.renderer.setStyle(this.el, 'display', 'none');
        
        const pathPermissions = rs.filter(p => p.path === this.path);

        this.cdRef.detectChanges();
    }
}
