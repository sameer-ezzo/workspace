import { JsonPointer, Patch } from "@noah-ark/json-patch";


export class DataResult<T = any> {
    data: T;
    meta?: { [key: string]: string };
    source: { type: "local" } | { type: "api" } | { type: "change", change: DataChange };
}


export class DataChange {
    _id?: string;
    constructor(public path: string, public date: Date, public lastChange: Date) { }
    patches: Patch[] = [];
    user?: any;
}

export class LocalStorageItem<T = any> {

    constructor(public originalDoc: T) { }

    editedDoc: T = null


    edits: DataEdit[] = [];
    redo: DataEdit[] = [];

    lastChange: Date;
    lastUse: Date;
}

export class DataEdit {
    do: Patch;
    undo: Patch;
    conflict?: Patch;

    static fromPatch<T = any>(doc: T, patch: Patch): DataEdit {
        let oldValue = undefined;
        switch (patch.op) {
            case "replace":
                try { oldValue = JsonPointer.get(doc, patch.path) } catch { }
                return { do: patch, undo: { op: "replace", path: patch.path, value: oldValue } }
            case "add": return { do: patch, undo: { op: "remove", path: patch.path } }
            case "remove":
                try { oldValue = JsonPointer.get(doc, patch.path) } catch { }
                return { do: patch, undo: { op: "add", path: patch.path, value: oldValue } }//what about no index?

            default: throw "Invalid patch operation";
        }
    }
}

export class DataConfig {
    enableLocalStorage = true;
}