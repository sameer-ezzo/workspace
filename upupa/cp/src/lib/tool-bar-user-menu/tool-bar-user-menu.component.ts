import { Component, computed, inject, input, Input, DOCUMENT } from "@angular/core";
import { filter, map, Observable } from "rxjs";
import { EventBus } from "@upupa/common";
import { AuthService } from "@upupa/auth";
import { SideBarItem } from "../side-bar-group-item";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { USER_PICTURE_RESOLVER } from "../di.token";
import { getUserInitialsImage } from "../user-image.service";
import { RouterLink } from "@angular/router";
import { MatIcon } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { MatDivider } from "@angular/material/divider";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatIconButton } from "@angular/material/button";
import { AuthorizeActionDirective } from "@upupa/authz";

@Component({
    selector: "toolbar-user-menu",
    imports: [CommonModule, MatIcon, MatDivider, MatMenu, MatIconButton, RouterLink, MatMenuTrigger, AuthorizeActionDirective, MatMenuItem],
    templateUrl: "./tool-bar-user-menu.component.html",
    styleUrls: ["./tool-bar-user-menu.component.scss"],
})
export class ToolbarUserMenuComponent {
    @Input() commands: SideBarItem[];
    readonly userImageResolver = inject(USER_PICTURE_RESOLVER) as Observable<string>;

    public readonly auth = inject(AuthService);
    private readonly bus = inject(EventBus);
    loginUrl = input("/login");

    u$ = this.auth.user$.pipe(takeUntilDestroyed());
    userName$ = this.u$.pipe(
        filter((u) => !!u),
        map((u) => u.name ?? u.email?.substring(0, u.email.indexOf("@"))),
    );

    impersonated = computed(() => this.auth.userSignal()?.claims?.["imps"] || undefined);

    umcClicked(e) {
        e = e.action;
        if (e.handler) e.handler({ action: e, data: null });
        else this.bus.emit(e.name, { msg: e.name, ...e }, this);
    }

    async signout() {
        await this.auth.signout();
        this.document.location.href = "/";
    }

    async unimpersonate() {
        await this.auth.unimpersonate();
        this.document.location.href = "/";
    }
    private readonly document = inject(DOCUMENT);
    handelImageError(event) {
        event.target.onerror = null;
        event.target.src = getUserInitialsImage(this.document, this.auth.user.name || this.auth.user.email);
    }
}
