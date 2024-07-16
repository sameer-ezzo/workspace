import { computed, inject, Injectable, signal } from "@angular/core";
import { DataService } from "@upupa/data";
import { catchError, map, startWith, tap } from "rxjs/operators";

import { BehaviorSubject, firstValueFrom, Observable, of, shareReplay } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { Rule } from "@noah-ark/common";
import { NodeModel } from "./node-model";
import { SimplePermission } from "@noah-ark/common";
import { TreeBranch } from "@noah-ark/path-matcher";
import { PERMISSIONS_BASE_URL } from "./app-admin-roles.token";


@Injectable({
    providedIn: "root",
})
export class PermissionsService {

    private _rulesActions = new Map<string, string[]>()

    private nodes: NodeModel[] = [];

    readonly _roles = signal<any[]>([])
    readonly roles = computed(() => this._roles())
    private readonly base = inject(PERMISSIONS_BASE_URL)
    private readonly data = inject(DataService)
    private readonly http = inject(HttpClient)

    constructor() {
        this.init()
    }
    async init() {
        firstValueFrom(
            this.data.get<any>(`/v2/role?select=name`).pipe(
                map(x => x.data),
                map(roles => (roles || []).filter(x => x._id !== 'super-admin'))
            )
        ).then(roles => this._roles.set(roles))
        await this.getRules()
    }

    userPermissions = new Map<string, Promise<SimplePermission[]>>();
    getUserPermissions(userId: string): Promise<SimplePermission[]> {
        if (!userId) return Promise.resolve([])
        if (this.userPermissions.has(userId)) return this.userPermissions.get(userId)
        this.userPermissions.set(userId, firstValueFrom(this.http.get<SimplePermission[]>(`${this.base}/user-permissions/${userId}`).pipe(
            startWith([]),
            catchError((err) => of([]))),
            // shareReplay(1)
        ))
        return this.userPermissions.get(userId)
    }
    async setRules(permissions: any) {
        await firstValueFrom(this.http.post(`${this.base}/restore-permissions`, permissions))
        return await this.getRules(true)
    }

    // Hierarchy of rules
    getRulesTree(): Promise<any> {
        return firstValueFrom(this.http.get<any>(`${this.base}/rules`))
    }

    async getRules(forceFresh = false): Promise<NodeModel[]> {
        if (!forceFresh && this.nodes?.length > 0) return this.nodes;

        const rulesTree = await this.getRulesTree()
        this.nodes = convertTreeToArray(rulesTree)
        return this.nodes
    }


    async getRuleActions(rule: Rule): Promise<string[]> {
        const path = rule.path
        const cached = this._rulesActions.get(path)
        const result = cached ? cached :
            await firstValueFrom(this.http.post<string[]>(`${this.base}/actions`, { path })
                .pipe(tap(acs => this._rulesActions.set(path, acs))
                ))
        return result
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