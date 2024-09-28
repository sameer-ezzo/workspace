import { Component, inject, Input } from "@angular/core";
import { filter, map, Observable } from "rxjs";
import { EventBus } from "@upupa/common";
import { AuthService, DEFAULT_LOGIN_PROVIDER_TOKEN } from "@upupa/auth";
import { SideBarItem } from "../side-bar-group-item";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { USER_PICTURE_RESOLVER } from "../di.token";
import { getUserInitialsImage } from "../user-image.service";
import { Router } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { MatDividerModule } from "@angular/material/divider";
import { AuthorizeModule } from "@upupa/authz";
import { MatMenuModule } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: "toolbar-user-menu",
    standalone: true,
    imports: [CommonModule, MatIconModule, MatDividerModule, AuthorizeModule, MatMenuModule, MatButtonModule],
    templateUrl: "./tool-bar-user-menu.component.html",
    styleUrls: ["./tool-bar-user-menu.component.scss"],
})
export class ToolbarUserMenuComponent {
    @Input() commands: SideBarItem[];
    readonly userImageResolver = inject(USER_PICTURE_RESOLVER) as Observable<string>;
    signInUrl = inject(DEFAULT_LOGIN_PROVIDER_TOKEN) as string;

    public readonly auth = inject(AuthService);
    private readonly bus = inject(EventBus);
    private readonly router = inject(Router);

    u$ = this.auth.user$.pipe(takeUntilDestroyed());
    userName$ = this.u$.pipe(
        filter((u) => !!u),
        map((u) => u.name ?? u.email?.substring(0, u.email.indexOf("@"))),
    );
    impersonated$ = this.u$.pipe(map((u) => u?.claims?.["imps"] || undefined));
    navigateToLogin() {
        const url = this.signInUrl || "/";
        const [path, qpsStr] = url.split("?");
        const qps = new URLSearchParams(qpsStr);
        this.router.navigate(
            path.split("/").filter((s) => s.length),
            { queryParams: Object.fromEntries(qps) },
        );
    }
    umcClicked(e) {
        e = e.action;
        if (e.handler) e.handler({ action: e, data: null });
        else this.bus.emit(e.name, { msg: e.name, ...e }, this);
    }

    signout() {
        this.auth.signout();
        document.location.href = "/";
    }

    async unimpersonate() {
        await this.auth.unimpersonate();
        document.location.href = "/";
    }

    handelImageError(event) {
        event.target.onerror = null;
        event.target.src = getUserInitialsImage(this.auth.user.name || this.auth.user.email);
    }
}
