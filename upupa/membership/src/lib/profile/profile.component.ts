import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { ChangeAvatarComponent } from "../change-avatar/change-avatar.component";
import { ChangePhoneComponent } from "../change-phone/change-phone.component";
import { ChangeEmailComponent } from "../change-email/change-email.component";

@Component({
    selector: "user-profile", templateUrl: "./profile.component.html", imports: [ChangeAvatarComponent, ChangePhoneComponent, ChangeEmailComponent]
})
export class ProfileComponent {
    @Input() appearance = "fill";
    @Input() emailName = "email";
    @Input() phoneName = "phone";
    @Input() avatarName = "avatar";

    @Output() changed = new EventEmitter<string>();
}
