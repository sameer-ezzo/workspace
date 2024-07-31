import { Component, inject, Input } from '@angular/core';
import { map, Observable } from 'rxjs';
import { EventBus } from '@upupa/common';
import { AuthService } from '@upupa/auth';
import { SideBarItem } from '../side-bar-group-item';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { USER_PICTURE_RESOLVER } from '../di.token';
import { getUserInitialsImage } from '../user-image.service';
import { Router } from '@angular/router';


@Component({
    selector: 'toolbar-user-menu',
    templateUrl: './tool-bar-user-menu.component.html',
    styleUrls: ['./tool-bar-user-menu.component.scss']
})
export class ToolbarUserMenuComponent {
    @Input() commands: SideBarItem[]
    readonly userImageResolver = inject(USER_PICTURE_RESOLVER) as Observable<string>
    public readonly auth = inject(AuthService)
    private readonly bus = inject(EventBus)

    u$ = this.auth.user$.pipe(takeUntilDestroyed())
    userName$ = this.u$.pipe(
        map(u => u.name ?? u.email?.substring(0, u.email.indexOf('@')))
    )
    impersonated$ = this.u$.pipe(
        map(u => u?.claims?.['imps'] || undefined)
    )
    umcClicked(e) {
        e = e.action;
        if (e.handler) e.handler({ action: e, data: null });
        else this.bus.emit(e.name, { msg: e.name, ...e }, this)
    }

    private readonly router = inject(Router)
    signout() {
        const user = { ...this.auth.user }
        this.auth.signout();
        this.router.navigate(['/'])
    }

    async unimpersonate() {
        await this.auth.unimpersonate()
        this.router.navigate(['/'])
    }

    handelImageError(event) {
        event.target.onerror = null;
        event.target.src = getUserInitialsImage(this.auth.user.name || this.auth.user.email);
    }
}
