import { Component, Output, EventEmitter } from "@angular/core";
import { UploadClient, openFileDialog, FileInfo } from "@upupa/upload";
import { AuthService } from "@upupa/auth";
import { firstValueFrom, map, Subscription, switchMap, tap } from "rxjs";
import { DataService } from "@upupa/data";
import { SnackBarService } from "@upupa/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: "change-avatar",
    templateUrl: "./change-avatar.component.html",
    styleUrls: ["./change-avatar.component.scss"],
    imports: [MatButtonModule, MatIconModule]
})
export class ChangeAvatarComponent {
    avatar: string;
    error = false;
    sub: Subscription;
    user: any;
    disabled: boolean;

    @Output() changed = new EventEmitter<true>();
    userAvatars: FileInfo[];

    constructor(
        public uploader: UploadClient,
        private dataService: DataService,
        public snack: SnackBarService,
        public auth: AuthService,
    ) {}

    ngOnInit() {
        this.sub = this.auth.user$
            .pipe(
                tap((u) => {
                    this.user = u;
                    this.error = false;
                }),
                switchMap((user) => this.dataService.get<FileInfo[]>(`storage?destination=storage/avatar/${user.sub}`)),
            )
            .subscribe(async (userAvatars) => {
                this.userAvatars = userAvatars.data;
                this.avatar = this.userAvatars.length > 0 ? `${this.userAvatars[0]?.path}?access_token=${this.auth.get_token()}` : "";
            });
    }
    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }

    async removeAvatar(path: string) {
        try {
            await this.uploader.delete(path);
        } catch (error) {
            console.error(error);
        }
    }

    async changeAvatar() {
        const files = await openFileDialog("image/*");
        if (files.length) {
            this.disabled = true;
            try {
                const userAvatar = await firstValueFrom(this.dataService.get<FileInfo[]>(`storage?destination=storage/avatar/${this.user.sub}`).pipe(map((res) => res.data?.[0])));
                if (userAvatar) {
                    await this.removeAvatar(userAvatar.path);
                }

                await firstValueFrom(this.uploader.upload(`/avatar/${this.user.sub}`, files[0], "avatar").response$);
                await this.auth.refresh();
                //force avatar refresh
                this.error = true;
                setTimeout(() => {
                    this.error = false;
                }, 200);
                this.snack.openSuccess();
                this.changed.emit(true);
            } catch (error) {
                this.snack.openFailed();
                console.error(error);
            } finally {
                this.disabled = false;
            }
        }
    }
}
