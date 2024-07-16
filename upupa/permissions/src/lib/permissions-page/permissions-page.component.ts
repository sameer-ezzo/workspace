import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { Rule } from '@noah-ark/common'
import { PermissionsService } from '../permissions.service'
import { NodeModel } from '../node-model'

@Component({
    selector: 'permissions-page',
    templateUrl: './permissions-page.component.html',
    styleUrls: ['./permissions-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionsPageComponent {

    nodes = signal<NodeModel[]>([])
    constructor(private permissionsService: PermissionsService) {
        this.permissionsService.getRules().then(x => this.nodes.set(x))
    }


    private _focused: Rule;
    public get focused(): Rule { return this._focused }
    public set focused(v: Rule) {
        if (this._focused === v) return
        this._focused = v
    }

    async download() {
        const permissions = await this.permissionsService.getRules(true)
        const json = JSON.stringify(permissions, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `permissions_${new Date().getTime() / 10000}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    async restore() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        input.click()
        const permissionsStr = await new Promise((resolve, reject) => {
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsText(file)
            }
        })
        const permissions = JSON.parse(permissionsStr as string)
        await this.permissionsService.setRules(permissions)

    }
}
