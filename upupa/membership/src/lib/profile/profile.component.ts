import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';


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