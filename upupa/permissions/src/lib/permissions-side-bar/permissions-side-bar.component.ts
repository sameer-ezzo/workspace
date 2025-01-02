import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from "@angular/core";
import { NodeModel } from "../node-model";
import { NgStyle, TitleCasePipe } from "@angular/common";
import { MatExpansionModule } from "@angular/material/expansion";

@Component({
    standalone: true,
    selector: "permissions-side-bar",
    templateUrl: "./permissions-side-bar.component.html",
    styleUrls: ["./permissions-side-bar.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgStyle, TitleCasePipe, MatExpansionModule],
})
export class PermissionsSideBarComponent {
    @Output() focusedChange = new EventEmitter<NodeModel>();
    @Input() nodes: NodeModel[] = [];
    private _focused: NodeModel;
    @Input()
    public get focused(): NodeModel {
        return this._focused;
    }
    public set focused(value: NodeModel) {
        if (this._focused === value) return;
        this._focused = value;
        this.focusedChange.emit(this.focused);
    }

    hasActiveChild(el: any) {
        const e = el._body?.nativeElement as HTMLElement;
        return e?.querySelector(".active") !== null;
    }
}
