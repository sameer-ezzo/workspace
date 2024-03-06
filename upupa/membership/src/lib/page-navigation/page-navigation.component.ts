import { Component, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'page-navigation',
  templateUrl: './page-navigation.component.html',
  styleUrls: ['./page-navigation.component.scss']
})
export class PageNavigationComponent {
  private _links: any[];
  @Input()
  public get links(): any[] {
    return this._links;
  }
  public set links(value: any[]) {
    this._links = value;
  }
  @Output() onLinkClick = new EventEmitter<any>();
  @Output() success = new EventEmitter<any>();
}
