import { Injectable } from "@angular/core";
import { DataService } from "@upupa/data";
import { map, startWith, tap } from "rxjs/operators";

import { firstValueFrom, Observable, of, shareReplay } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Rule } from "@noah-ark/common";
import { NodeModel } from "./node-model";
import { SimplePermission } from "@noah-ark/common";
import { TreeBranch } from "@noah-ark/path-matcher";

@Injectable({
    providedIn: "root",
})
export class PermissionsService {
    private _rulesActions = new Map<string, string[]>()

    private nodes: NodeModel[] = [];

    readonly roles$: Observable<any[]>;

    readonly base!: string;
    adminRoles: any[];
    constructor(private readonly data: DataService, private readonly http: HttpClient
        // @Inject(APP_ADMIN_ROLES_TOKEN) private adminRoles: UserRole[]
    ) {
        this.base = `${this.data.api.api_base.substring(0, this.data.api.api_base.length - 4)}/permissions`
        if (!this.roles$) this.roles$ = this.data.get<any>(`/v2/role?select=name`).pipe(
            map((x) => x.data),
            map((roles) => roles.concat(this.adminRoles ?? [])),
            shareReplay()
        )
    }

    getRules(): Observable<NodeModel[]> {
        if (this.nodes?.length > 0) return of(this.nodes);
        return this.http.get<any>(`${this.base}/rules`).pipe(
            map((tree) => {
                this.nodes = convertTreeToArray(tree)
                return this.nodes;
            }),
            startWith(this.nodes)
        );
    }


    getRuleActions(rule: Rule): Promise<string[]> {
        const path = rule.path
        const cached = this._rulesActions.get(path)
        const acs$ = cached ? of(cached) :
            this.http.post<string[]>(`${this.base}/actions`, { path })
                .pipe(tap(acs => this._rulesActions.set(path, acs))
                )

        return firstValueFrom(acs$)
    }
    async addOrUpdatePermission(permission: SimplePermission): Promise<SimplePermission> {

        const p = { ...permission } as SimplePermission
        return await firstValueFrom(
            this.http.post<SimplePermission>(`${this.base}/updatePermission`, p)
        )


    }

    async deletePermission(permission: any) {
        try {
            await firstValueFrom(
                this.http.delete(`${this.base}/deletePermission/${permission._id}`)
            )

        } catch (error) {
            console.error(error);
        }
    }
}

export function convertTreeToArray<T>(tree: TreeBranch<T>): NodeModel<T>[] {
    const res: NodeModel<T>[] = []

    const extract = (node, level, acc) => {
        const x = { path: node.item?.path, rule: node.item, level, children: [] }
        for (const r in node.children) extract(node.children[r], level + 1, x.children)
        acc.push(x)
    }
    for (const rc in tree['/'].children) extract(tree['/'].children[rc], 0, res)

    return res
}