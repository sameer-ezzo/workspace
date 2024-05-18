import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, inject, Input } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { Principle } from "@noah-ark/common";
import { AuthService } from "@upupa/auth";
import { PermissionsService } from "./permissions.service";



@Directive({
    selector: '[auth-action]',
    exportAs: 'auth-action'
})
export class AuthorizeActionDirective implements AfterViewInit {
    private readonly el = inject(ElementRef).nativeElement;
    private readonly permissions = inject(PermissionsService);
    private readonly auth = inject(AuthService);
    private readonly cdRef = inject(ChangeDetectorRef);
    @Input() action: string;
    @Input() path: string;
    @Input() user: Principle = this.auth.user;

    async ngAfterViewInit(): Promise<void> {
        if (!this.path) return;
        const rules = await this.permissions.getUserPermissions(this.user?.sub ?? '')
        if (rules.length === 0) return;

        if (!this.user) this.el.style.display = 'none';
        const roles = this.user?.roles || [];
        if (roles.length === 0)
            if ('disabled' in this.el) this.el.disabled = true;
            else this.el.style.display = 'none';

        this.cdRef.detectChanges();
    }
}
