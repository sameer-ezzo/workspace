import { Injectable } from "@angular/core";
import { JsonPatch, JsonPointer, Patch } from "@noah-ark/json-patch";
import { LocalStorageItem, DataEdit } from "./model";

import { PathInfo } from '@noah-ark/path-matcher';

type StorageItem = { collection: string, id: string, item: LocalStorageItem };

export const CACHE_KEY = "l";
//todo move to indexed db
//https://dexie.org/docs/
//https://medium.com/@filipvitas/indexeddb-with-promises-and-async-await-3d047dddd313
@Injectable({ providedIn: 'root' })
export class LocalService {

    get<T = any>(path: string): T {
        const p = PathInfo.parse(path);

        if (p.id) return this._getDoc(p.collection, p.id, p.pointer);
        else if (p.collection) return this._getCollection(p.collection, p.criteria);
        else return this._getAll(p.criteria);
    }

    private _getDoc<T = any>(collection: string, id: string, pointer?: string): T {
        const item = this.getLocalStorageItem(collection, id);
        if (!item) return null;

        item.lastUse = new Date();
        this.setLocalStorageItem(collection, id, item);

        const doc = item.editedDoc;

        if (doc != null && pointer) {
            try {
                return JsonPointer.get(doc, pointer);
            } catch (error) {
                return null;
            }
        }

        return doc;
    }
    private _getCollection(collection: string, criteria?: { key: string, value: string }[]): any {
        const kBase = `${CACHE_KEY}_${collection}:`;
        const ids = Object.keys(localStorage)
            .filter(key => key.startsWith(kBase))
            .map(k => k.substring(kBase.length))

        const data = ids.map(id => this._getDoc(collection, id));
        return this._query(data, criteria);
    }

    private _getAll(criteria?: { key: string, value: string }[]): any {
        const kBase = `${CACHE_KEY}_`;
        const ids = Object.keys(localStorage)
            .filter(key => key.startsWith(kBase))
            .map(k => k.substring(kBase.length))
            .map(k => k.split(":"))
            .map(x => { return { collection: x[0], id: x[1] } })

        const data = ids.map(x => this._getDoc(x.collection, x.id));
        return this._query(data, criteria);
    }

    private _query(data: any[], criteria?: { key: string, value: string }[]): any[] {
        if (!criteria || criteria.length === 0) return data;

        //todo OR + recognize date
        const filterCriteria: { key: string, value: string }[] = [];
        let sort_by: string;
        let page = 1;
        let per_page = 100;
        for (let i = 0; i < criteria.length; i++) {
            const x = criteria[i];
            switch (x.key) {
                case "sort_by": sort_by = x.value; break;
                case "page": if (+x.value > 1) page = +x.value; break;
                case "per_page": if (+x.value > 0 && +x.value < 100) per_page = +x.value; break;
                default: filterCriteria.push(x); break;
            }
        }


        let result = this.where(data, filterCriteria);
        if (sort_by) {
            let dir: string;
            [sort_by, dir] = sort_by.split(",");
            dir = dir || "asc"
            result = this.order(result, { [sort_by]: dir === "asc" ? "asc" : "desc" });
        }

        result = result.slice((page - 1) * per_page, page * per_page);

        return result;
    }

    where<T = any>(data: T[], criteria: { key: string, value: string }[]): T[] {
        if (!criteria || criteria.length === 0) return data;

        const regex = /\{(\S+)\}(\S+)/;
        return data.filter(x => criteria.every(c => {
            const a = x[c.key];
            let b = c.value;
            const match = regex.exec(b);
            if (match) {
                let op;[, op, b] = match;
                switch (op) {
                    case "gt": return +a > +b;
                    case "gte": return +a >= +b;
                    case "lt": return +a < +b;
                    case "lte": return +a <= +b;
                    case "ne": return +a !== +b;
                    case "like": return a.indexOf(b) > -1;
                }
            }
            return a === b;
        }));
    }
    order<T = any>(data: T[], criteria: { [property: string]: "asc" | "desc" }) {
        if (!criteria) return data;
        const properties = Object.keys(criteria);
        if (properties.length === 0) return data;

        return data.sort((a, b) => {
            for (let i = 0; i < properties.length; i++) {
                const p = properties[i];
                const direction = criteria[p] === "asc" ? 1 : -1;

                let cmp = 0;
                if (a[p] >= b[p]) cmp = 1;
                if (a[p] <= b[p]) cmp = -1;
                if (cmp != 0) return direction * cmp;
            }
            return 0
        });
    }

    patchDocument(collection: string, id: string, patches: Patch[]): void {
        const item = this.getLocalStorageItem(collection, id) || new LocalStorageItem({ _id: id });

        const edits = patches.map(p => DataEdit.fromPatch(item.editedDoc, p));
        item.edits.push(...edits);
        item.editedDoc = JsonPatch.patch(item.editedDoc || item.originalDoc, patches);

        this.setLocalStorageItem(collection, id, item);
    }


    patch(path: string, patches: Patch[]): void { //todo test
        const pathInfo = PathInfo.parse(path);
        patches = patches.map(p => { return { ...p, path: pathInfo.pointer + p.path } });
        this.patchDocument(pathInfo.collection, pathInfo.id, patches);
    }


    set<T = any>(path: string, data: T): void {
        const pathInfo = PathInfo.parse(path);

        if (pathInfo.id) {
            const item = this.getLocalStorageItem(pathInfo.collection, pathInfo.id) || new LocalStorageItem<T>(<any>{});

            if (pathInfo.pointer) {
                const doc = item && item.originalDoc ? item.originalDoc : {};
                JsonPointer.set(doc, pathInfo.pointer, data);
                item.originalDoc = doc;
            }
            else {
                item.originalDoc = data;
                item.lastChange = new Date(); //suppose this is a fresh document and set change date accordingly
            }

            item.editedDoc = item.originalDoc;

            this.setLocalStorageItem(pathInfo.collection, pathInfo.id, item);
        }
        else {
            const collection: any[] = <any>data;
            collection.forEach(doc => { if (doc._id) this.set(`/${pathInfo.collection}/${doc._id}`, doc); });
            // collection.forEach(doc => { if (doc._id) this.set(`/${path}/${doc._id}`, doc); });
        }

    }


    applyPendingEdits(path: string): boolean {
        const pathInfo = PathInfo.parse(path);
        if (!pathInfo.collection || !pathInfo.id || pathInfo.pointer || pathInfo.criteria)
            throw `Invalid Args: applyPendingEdits only works on Document Path collection/id not ${path}`;

        return this.applyPendingEditsDocument(pathInfo.collection, pathInfo.id);
    }
    applyPendingEditsDocument<T = any>(collection: string, id: string): T | null {
        if (!collection || !id) throw `Invalid Args: applyPendingEditsDocument only works on Document`;

        const item = this.getLocalStorageItem(collection, id);
        if (item && item.edits && item.edits.length) {
            item.editedDoc = JsonPatch.patch(item.originalDoc, item.edits.map(x => x.do));
            this.setLocalStorageItem(collection, id, item);
            return item.editedDoc;
        }
        return null;
    }

    getLocalStorageItems(): StorageItem[] {
        const kBase = `${CACHE_KEY}_`;
        const ids = Object.keys(localStorage)
            .filter(key => key.startsWith(kBase))
            .map(k => k.substring(kBase.length))
            .map(k => k.split(":"))
            .map(x => { return { collection: x[0], id: x[1] } })

        return ids.map(x => {
            return {
                collection: x.collection,
                id: x.id,
                item: this.getLocalStorageItem(x.collection, x.id)
            }
        });
    }
    getLocalStorageItem(collection: string, id: string): LocalStorageItem {
        const key = `${CACHE_KEY}_${collection}:${id}`;
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    }
    // getLocalStorageItemsOfCollection(collection: string): LocalStorageItem[] {
    //     const key = `${CACHE_KEY}_${collection}:`;
    //     return Object.keys(localStorage).filter(k => k.startsWith(key)).map(key => {
    //         const value = localStorage.getItem(key);
    //         return value ? JSON.parse(value) : null;
    //     });
    // }
    setLocalStorageItem(collection: string, id: string, item: LocalStorageItem) {
        const key = `${CACHE_KEY}_${collection}:${id}`;
        localStorage.setItem(key, JSON.stringify(item));
    }

}



export class CacheKeeper {

    constructor(private local: LocalService) { }


    //todo smart trigger (not with every sync) maybe size or count, maybe interval
    isRefreshCandidate(item: StorageItem): boolean {
        return item != null;
    }

    isRemoveCandidate(x: StorageItem): boolean {
        const now = new Date();
        const age = now.getMilliseconds() - x.item.lastUse.getMilliseconds();
        const lifeSpan = 259200000; //3 days
        return age > lifeSpan;
    }


    getRefreshCandidates(): StorageItem[] {
        const items = this.local.getLocalStorageItems();
        return items.filter(x => this.isRefreshCandidate(x));
    }

    getRemoveCandidate() {
        const items = this.local.getLocalStorageItems();
        return items.filter(x => this.isRemoveCandidate(x));
    }

    remove() {

    }
}