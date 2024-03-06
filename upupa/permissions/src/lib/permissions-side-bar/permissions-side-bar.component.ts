import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { Rule } from '@noah-ark/common'
import { NodeModel } from '../node-model';


@Component({
    selector: 'permissions-side-bar',
    templateUrl: './permissions-side-bar.component.html',
    styleUrls: ['./permissions-side-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionsSideBarComponent {

    @Output() focusedChange = new EventEmitter<Rule>()
    @Input() nodes:NodeModel[] = []
    private _focused: Rule;
    public get focused(): Rule {
        return this._focused;
    }
    public set focused(value: Rule) {
        if (this._focused === value || !value.name) return
        this._focused = value;
        this.focusedChange.emit(this.focused)
    }

}