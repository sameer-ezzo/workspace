import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '@upupa/auth';
import { } from '@upupa/common';
import { SnackBarService } from '@upupa/common';
import { DataService } from '@upupa/data';


@Component({
  selector: 'user-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent {

  @Input() appearance = 'fill';
  @Input() emailName = 'email';
  @Input() phoneName = 'phone';
  @Input() avatarName = 'avatar';

  @Output() changed = new EventEmitter<string>();
}