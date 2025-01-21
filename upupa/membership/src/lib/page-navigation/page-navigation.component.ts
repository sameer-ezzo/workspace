import { Component, Input, EventEmitter, Output } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    standalone: true,
    selector: "page-navigation",
    templateUrl: "./page-navigation.component.html",
    styleUrls: ["./page-navigation.component.scss"],
    imports: [RouterLink],
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
