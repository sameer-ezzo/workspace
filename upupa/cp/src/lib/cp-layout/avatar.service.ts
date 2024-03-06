import { Injectable } from '@angular/core'
import { AuthService } from '@upupa/auth'
import { DataService } from '@upupa/data'
import { FileInfo } from '@upupa/upload'
import { BehaviorSubject, catchError, combineLatest, debounceTime, firstValueFrom, from, map, Observable, of, ReplaySubject, switchMap, tap } from 'rxjs'
import { Principle } from '@noah-ark/common'

declare var base;
export type AvatarMode = 'initials' | 'avatar' | 'name'
@Injectable({
    providedIn: 'root'
})
export class UserAvatarService {

    private readonly _avatarModeChanged = new BehaviorSubject<AvatarMode>('initials')
    public get avatarMode(): AvatarMode { return this._avatarModeChanged.value; }
    public set avatarMode(v: AvatarMode) {
        this._avatarModeChanged.next(v)
    }

    userAvatar: Observable<any>
    constructor(public auth: AuthService, private dataService: DataService) {
        this.userAvatar = combineLatest([this._avatarModeChanged, this.auth.user$]).pipe(
            debounceTime(250),
            switchMap(([mode, principle]) => this.getAvatar(mode, principle))
        )
    }


    getAvatar(mode: AvatarMode, principle: Principle): Observable<string> {
        if (!principle) return of('')
        switch (mode) {
            case 'avatar': return this.dataService.get<{ picture: string }>(`/user/${principle.sub}?select=picture`)
                .pipe(
                    map(x => x.picture as string),
                    catchError(e => {
                        console.error('error getting avatar', e);
                        return this.getAvatar('initials', principle)
                    })
                )
            case 'initials': return of(this.generateInitialsAvatar(principle.name ?? principle.email))
            default: return of('')
        }
    }

    private _getInitials(name: string, initialsCount: number = 2) {
        return name?.split(' ').map(x => x.trim()).filter(x => x.length > 0).slice(0, initialsCount).map(x => x[0].toLocaleUpperCase()).join('');
    }
    private generateInitialsAvatar(userName: string, initialsCount = 2) {
        //TODO: replace with initials extraction logic.

        const initials = this._getInitials(userName, initialsCount)
        if (!initials || initials.length < 1) return ''

        const randomColor = '#2e7d32dd' //'#' + (0x1000000 | (Math.random() * 0xFFFFFF)).toString(16).substring(1, 6);


        // Create a rectangular canvas which will become th image.
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        canvas.width = canvas.height = 100;

        // Draw the circle in the background using the randomColor.
        context.fillStyle = randomColor;
        context.beginPath();
        context.ellipse(
            canvas.width / 2, canvas.height / 2, // Center x and y.
            canvas.width / 2, canvas.height / 2, // Horizontal and vertical "radius".
            0, // Rotation, useless for perfect circle.
            0, Math.PI * 2 // from and to angle: Full circle in radians.
        );
        context.fill();

        context.font = (canvas.height / 2) + "px serif";
        context.fillStyle = "#fff";
        // Make the text's center overlap the image's center.
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(initials, canvas.width / 2, canvas.height / 2);
        return canvas.toDataURL();
    }

}