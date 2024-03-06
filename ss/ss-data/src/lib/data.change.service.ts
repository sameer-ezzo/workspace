import { Document } from "mongoose";
import { Patch, DataChange } from "./model";
import { PathInfo } from "@noah-ark/path-matcher";
import { Injectable } from "@nestjs/common";
import { PathMatcher } from "@noah-ark/path-matcher";
import { JsonPointer } from "@noah-ark/json-patch";
import { DataService } from "./data.svr";
import { join } from "path";


@Injectable()
export class DataChangeService {
    private triggersPathMatcher = new PathMatcher<DataTrigger>(<any>{});

    constructor(private dataService: DataService) { }
    onChange<T = Document>(path: string, onChange: DataChangeFn<T>) {
        const trigger = this.triggersPathMatcher.get(path); //this will return an object of the Data Trigger class without the addChangeHanler


        if (trigger) addChangeHandler(trigger, onChange)
        else this.triggersPathMatcher.add(path, new DataTrigger(path, [onChange]));
    }
    onChanging<T = Document>(path: string, onChanging: DataChangingFn<T>) {
        const trigger = this.triggersPathMatcher.get(path);
        if (trigger) addChangingHandler(trigger, onChanging)
        else this.triggersPathMatcher.add(path, new DataTrigger(path, [], [onChanging]));
    }
    async dataChanging(path: string, rootDoc: Document, patches: Patch[], user: any): Promise<string[]> {

        patches = patches.map(p => Object.assign({}, p));
        const pathInfo = PathInfo.parse(path);
        const basePath = '/' + [pathInfo.collection, pathInfo.id].filter(x => x).join('/');
        if (pathInfo.pointer) patches.forEach(p => p.path = basePath + p.path);
        const change: Partial<DataChange> = { path: basePath, user, date: new Date(), patches };


        const consolidatedListeners = [];
        const allListeners = patches.map(p => this.findListeners(basePath, p))
            .reduce((x, y) => x.concat(y));



        //consolidate matches
        while (allListeners.length) {
            const firstMatch = allListeners.shift()!;
            for (let i = 0; i < allListeners.length; i++) {
                const x = allListeners[i];
                if (x.t === firstMatch.t) {
                    allListeners.splice(i, 1);
                    --i;
                    firstMatch.p.push(...x.p);
                }
            }
            consolidatedListeners.push(firstMatch);
        }
        //call trigger handlers
        const changeErrors = await this._notifyChanging(consolidatedListeners, change, rootDoc);
        return <string[]>changeErrors.filter(x => x);

    }
    async dataChange(path: string, rootDoc: Document, patches: Patch[], user: any) {
        const change = await this._registerChange(path, patches, user); //normalize and save to db

        const consolidatedListeners = [];
        const allListeners = change.patches
            .map(p => this.findListeners(change.path, p))
            .reduce((x, y) => x.concat(y));



        //consolidate matches
        while (allListeners.length) {
            const firstMatch = allListeners.shift()!;
            for (let i = 0; i < allListeners.length; i++) {
                const x = allListeners[i];
                if (x.t === firstMatch.t) {
                    allListeners.splice(i, 1);
                    --i;
                    firstMatch.p.push(...x.p);
                }
            }
            consolidatedListeners.push(firstMatch);
        }
        //call trigger handlers
        this._notifyChange(consolidatedListeners, change, rootDoc);
    }

    findListeners(basePath: string, patch: Patch): { t: DataTrigger, v: any, p: Patch[] }[] {
        if (typeof patch.value === 'object' || Array.isArray(patch.value)) {
            const reversePatches = JsonPointer.reverse(patch.value);
            if (reversePatches.length === 0) return [];
            return reversePatches.map(subPatch => {
                const fullPath = join(basePath, patch.path, subPatch.path)
                const tree = this.triggersPathMatcher.match(fullPath);
                const triggers = tree.matches;
                return triggers.map(t => {
                    return { t: t.item, v: tree.values, p: [this.cascadePatchPath(t.item.path, patch, subPatch)] }
                });
            }).reduce((x, y) => x.concat(y));

        } else {
            const fullPath = basePath + patch.path;
            const tree = this.triggersPathMatcher.match(fullPath);
            const triggers = tree.matches;
            return triggers.filter(t => t.item?.path).map(t => {
                return { t: t.item, v: tree.values, p: [this.cascadePatchPath(t.item!.path!, patch)] }
            });
        }
    }

    cascadePatchPath(basePath: string, patch: Patch, subPatch?: Patch): Patch {
        let path = (patch.path === '/' ? '' : patch.path);
        if (subPatch) path += (subPatch.path === '/' ? '' : subPatch.path)
        if (basePath) {
            const basePathInfo = PathInfo.parse(basePath);
            path = '/' + path.substring((basePathInfo.pointer ? basePathInfo.pointer.length : 0) + 1);
        }
        return Object.assign({}, subPatch ? subPatch : patch, { path });
    }

    _notifyChange(listeners: { t: DataTrigger, v: any, p: Patch[] }[], change: DataChange, rootDoc: any) {
        listeners.filter(r => r.t.onChangeHandler)
            .forEach(x => {
                const trigger = x.t;
                const triggerPath = trigger.path ? trigger.path.split('/').filter(s => s)
                    .map(s => s.startsWith(':') ? x.v[s] : s)
                    .join('/') || '/' : '/';

                if (triggerPath === '/') trigger.onChangeHandler(rootDoc, change, x.p);
                else {
                    const triggerPathInfo = PathInfo.parse(triggerPath);
                    const pointer = triggerPathInfo.pointer;
                    if (pointer) {
                        // const subDoc = JsonPointer.get(rootDoc, '/' + pointer);
                        trigger.onChangeHandler(rootDoc, change, x.p);
                    } else {
                        trigger.onChangeHandler(rootDoc, change, x.p);
                    }
                }
            });
    }

    async _notifyChanging(listeners: { t: DataTrigger, v: any, p: Patch[] }[], change: Partial<DataChange>, rootDoc: any): Promise<(string | null)[]> {
        const changingError: (string | null)[] = [];
        const array = listeners.filter(r => r.t.onChangingHandler);
        for (let i = 0; i < array.length; i++) {
            const x = array[i];
            const trigger = x.t;
            const triggerPath = trigger.path ? trigger.path.split('/').filter(s => s)
                .map(s => s.startsWith(':') ? x.v[s] : s)
                .join('/') || '/' : '/';

            if (triggerPath === '/') changingError.push(...await trigger.onChangingHandler(rootDoc, change, x.p));
            else {
                const triggerPathInfo = PathInfo.parse(triggerPath);
                const pointer = triggerPathInfo.pointer;
                if (pointer) {
                    // const subDoc = JsonPointer.get(rootDoc, '/' + pointer);
                    changingError.push(...await trigger.onChangingHandler(rootDoc, change, x.p));
                } else {
                    changingError.push(...await trigger.onChangingHandler(rootDoc, change, x.p));
                }
            }
        };
        return changingError;
    }

    async _registerChange(path: string, patches: Patch[], user: any): Promise<DataChange> {
        patches = patches.map(p => Object.assign({}, p));

        const pathInfo = PathInfo.parse(path);
        const basePath = '/' + [pathInfo.collection, pathInfo.id].filter(x => x).join('/') as  string;
        if (pathInfo.pointer) patches.forEach(p => p.path = basePath + p.path);

        const changeModel = (await this.dataService.getModel("change"))!
        const lastChange = await changeModel.findOne({ path }).sort({ _id: -1 }).select({ date: 1 });
        const lastChangeDate = lastChange ? lastChange.date : undefined;
        const change: DataChange = { lastChange: lastChangeDate, path: basePath, user: user ? { sub: user.sub, email: user.email, roles: user.roles, claims: user.claims } : undefined, date: new Date(), patches };

        await changeModel.create(change);
        return change;
    }
}

export type DataChangeFn<T = any> = (doc: any, change: DataChange, cascades: Patch[]) => Promise<void>;
export type DataChangingFn<T = any> = (doc: any, change: Partial<DataChange>, cascades: Patch[]) => Promise<string[]>;

export class DataTrigger<T = Document> {

    readonly _onChangeHandler: DataChangeFn<T>[] = [];
    readonly _onChangingHandler: DataChangingFn<T>[] = [];

    onChangeHandler = async (doc: T, change: DataChange, cascades: Patch[]) => {
        for (let i = 0; i < this._onChangeHandler.length; i++) {
            await this._onChangeHandler[i](doc, change, cascades);
        }
    }

    onChangingHandler = async (doc: T, change: Partial<DataChange>, cascades: Patch[]) => {
        const errors: string[] = [];
        for (let i = 0; i < this._onChangingHandler.length; i++) {
            errors.push(... (await this._onChangingHandler[i](doc, change, cascades)));
        }
        return errors;
    }


    constructor(public readonly path: string, onChange?: DataChangeFn[], onChanging?: DataChangingFn[]) {
        this._onChangeHandler.push(...(onChange ?? []))
        this._onChangingHandler.push(...(onChanging ?? []))
    }

}


function addChangeHandler(trigger: DataTrigger, onChange: DataChangeFn) {
    trigger._onChangeHandler.push(onChange)
}

function addChangingHandler(trigger: DataTrigger, onChanging: DataChangingFn) {
    this._onChangingHandler.push(onChanging)
}