import { Component, Input, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { EventBus } from '@upupa/common';
import { AuthService } from '@upupa/auth';
import { SideBarItem } from '../cp-layout/side-bar-group-item';
import { UserImageService } from '../user-image.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
    selector: 'toolbar-user-menu',
    templateUrl: './tool-bar-user-menu.component.html',
    styleUrls: ['./tool-bar-user-menu.component.scss']
})
export class ToolbarUserMenuComponent {
    @Input() commands: SideBarItem[]


    impersonated = signal<boolean>(false)
    destroyed$ = new Subject<boolean>()

    username = signal<string>('')


    constructor(
        public auth: AuthService,
        public userImageService: UserImageService,
        private bus: EventBus) {
        this.auth.user$.pipe(takeUntilDestroyed()).subscribe(u => {
            const impersonated = u?.claims?.['imps'] || undefined
            this.impersonated.set(impersonated !== undefined)
            this.username.set(u.name ?? u.email?.substring(0, u.email.indexOf('@')))
        })
    }



    ngOnDestroy(): void {
        this.destroyed$.next(true)
        this.destroyed$.complete()
    }

    umcClicked(e) {
        e = e.action;
        if (e.handler) e.handler({ action: e, data: null });
        else this.bus.emit(e.name, { msg: e.name, ...e }, this)
    }

    signout() {
        const user = { ...this.auth.user }
        this.auth.signout();
        this.bus.emit('user-signed-out', { user, signedOut: true }, this)
        window.location.href = '/'
    }

    async unimpersonate() {
        await this.auth.unimpersonate()
        this.bus.emit('user-unimpersonated', true, this)
    }
}
