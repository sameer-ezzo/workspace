import { Component, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { EventBus } from '@upupa/common';
import { AuthService } from '@upupa/auth';
import { SideBarItem } from '../cp-layout/side-bar-group-item';
import { UserImageService } from '../user-image.service';


@Component({
    selector: 'toolbar-user-menu',
    templateUrl: './tool-bar-user-menu.component.html',
    styleUrls: ['./tool-bar-user-menu.component.scss']
})
export class ToolbarUserMenuComponent {
    @Input() commands: SideBarItem[]


    destroyed$ = new Subject<boolean>()

    get username$() {
        return this.auth.user$.pipe(filter(u => u != null),
            map(u => u != null ? (u.name ?? u.email?.substring(0, u.email.indexOf('@'))) : ''));
    }


    constructor(
        public auth: AuthService,
        public userImageService: UserImageService,
        private bus: EventBus) {
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
