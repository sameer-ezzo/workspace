import { Component, Input, SimpleChanges } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { EventBus } from '@upupa/common';
import { DataService } from '@upupa/data';
import { AuthService } from '@upupa/auth';
import { AvatarMode, UserAvatarService } from '../cp-layout/avatar.service';
import { SideBarGroup } from '../cp-layout/side-bar-group-item';


@Component({
    selector: 'toolbar-user-menu',
    templateUrl: './tool-bar-user-menu.component.html',
    styleUrls: ['./tool-bar-user-menu.component.scss']
})
export class ToolbarUserMenuComponent {
    @Input() commands: SideBarGroup[]


    destroyed$ = new Subject<boolean>()

    get username$() {
        return this.auth.user$.pipe(filter(u => u != null),
            map(u => u != null ? (u.name ?? u.email?.substring(0, u.email.indexOf('@'))) : ''));
    }


    constructor(
        public auth: AuthService,
        public avatarService: UserAvatarService,
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
