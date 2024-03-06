import { ChangeDetectionStrategy, Component } from '@angular/core'
import { Rule } from '@noah-ark/common'
import { PermissionsService } from '../permissions.service'
import { Observable } from 'rxjs'
import { NodeModel } from '../node-model'

@Component({
    selector: 'permissions-page',
    templateUrl: './permissions-page.component.html',
    styleUrls: ['./permissions-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionsPageComponent {

    nodes$:Observable<NodeModel[]>
    constructor(private permissionsService: PermissionsService) { 
        this.nodes$ = this.permissionsService.getRules()
    }


    private _focused: Rule;
    public get focused(): Rule { return this._focused }
    public set focused(v: Rule) {
        if (this._focused === v) return
        this._focused = v
    }

}
