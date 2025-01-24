import { ChangeDetectionStrategy, Component, EventEmitter, model, output, Output, input } from "@angular/core";
import { NodeModel } from "../node-model";
import { CommonModule, NgStyle, TitleCasePipe } from "@angular/common";
import { MatExpansionModule, MatExpansionPanel } from "@angular/material/expansion";

@Component({
    standalone: true,
    selector: "permissions-side-bar",
    templateUrl: "./permissions-side-bar.component.html",
    styleUrls: ["./permissions-side-bar.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, NgStyle, TitleCasePipe, MatExpansionModule],
})
export class PermissionsSideBarComponent {
    readonly nodes = input.required<NodeModel[]>();
    focused = model<NodeModel>();

    hasActiveChild(el: MatExpansionPanel) {
        if (el.opened) return true;
        const e = el._body?.nativeElement as HTMLElement;
        return e?.querySelector(".active") !== null;
    }

    activateNode(e: any, panel: MatExpansionPanel, node: NodeModel) {
        if (node.children?.length) e.preventDefault();
        this.focused.set(node);
    }
}
