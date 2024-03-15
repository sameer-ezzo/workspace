import { Patch } from "./model";

export class JsonPointer {
    static set(doc: any, path: string, value: any): any {
        const result = doc || {};
        const segments = path.split("/").filter(s => s);
        if (segments.length === 0) return value != null && JsonPointer.isObject(result) ? { ...result, ...value } : value;
        let x = result;

        for (let i = 0; i < segments.length - 1; i++) {
            const s1 = segments[i];
            const s2 = segments[i + 1];

            if (x[s1] === undefined) {
                if (isNaN(+s2)) x[s1] = {};
                else x[s1] = [];
            }
            x = x[s1];
        }
        x[segments.pop()!] = value;
        return result;
    }

    static unset(doc: any, path: string): void {
        doc = doc ?? {};
        const segments = path.split("/").filter(s => s);
        if (segments.length === 0) throw "INVALID_PATH";

        const s = segments.pop()!;
        const parentPath = segments.join('/');
        const parent = JsonPointer.get(doc, parentPath);
        delete parent[s];
    }

    static get<T = any>(doc: any, path: string): T | undefined {
        const segments = path.split("/").filter(s => s);
        if (segments.length === 0) return doc;
        const property = segments.pop()!;
        let x = doc;
        for (let i = 0; i < segments.length; ++i) {
            const s = segments[i];
            if (x[s] === undefined) return undefined;
            x = x[s];
        };
        return x?.[property];
    }
    static nonObjTypes = ["string", "bigint", "boolean", "function", "number", "symbol"];
    static isObject(obj: any): boolean {
        const type = typeof (obj);
        return !(obj === null || Array.isArray(obj) || JsonPointer.nonObjTypes.some(t => t === type));
    }

    static reverse(obj: any): Patch[] {

        if (Array.isArray(obj)) {
            if (!obj.length) return [];
            return obj.map((x, i) => JsonPointer.reverse(x).map(p => Object.assign(p, { path: `/${i}${p.path}` })))
                .reduce((x, y) => x.concat(y));
        } else {

            const patches: Patch[] = [];
            const type = typeof obj;
            let premitive = false;
            let nested = false;
            switch (type) {
                case 'number':
                case 'string':
                case 'bigint':
                case 'boolean':
                case 'symbol': premitive = true; break;
                case 'function': break; //nothing
                default:
                    if (obj === null || obj instanceof Date) premitive = true;
                    else nested = true;
                    break;
            }

            if (premitive) patches.push({ op: "replace", path: '', value: obj });
            if (nested) {

                const keys = Object.keys(obj);
                if (keys.length) {
                    const subPatches = keys.map(k => JsonPointer.reverse(obj[k])
                        .map(p => Object.assign(p, { path: `/${k}${p.path}` })))
                        .reduce((x, y) => x.concat(y));

                    patches.push(...subPatches);
                }
            }
            return patches;
        }
    }
}


export class JsonPatch {
    private static _ApplyPatch<T>(doc: T, p: Patch): T {
        const result = JSON.parse(JSON.stringify(doc));
        const segments = p.path.split("/").filter(s => s);
        switch (p.op) {
            case "replace": return JsonPointer.set(result, p.path, p.value);
            case "add": return this._add(result, segments, p.value);
            case "remove": return this._remove(result, segments);
            default: throw "Invalid patch operator";
        }
    }

    static patch<T>(doc: T, patches: Patch[]): T {
        let result = doc;
        patches.forEach(p => result = this._ApplyPatch(result, p));
        return result;
    }

    private static _add(result: any, segments: string[], value: any) {
        const last : any = segments.length ? segments[segments.length - 1] : null;
        let index: number | null = null;
        if (last === "-" || !isNaN(index = +last)) segments.pop();
        const path = segments.join("/");

        let array = JsonPointer.get(result, path);
        if (array === undefined) {
            array = [];
            JsonPointer.set(result, path, array);
        }
        if (Array.isArray(array)) {
            if (index === null) array.push(value);
            else array.splice(index, 0, value);
            return result;
        }
        else throw "Can not add value to non-array path";
    }

    private static _remove(result: any, segments: string[]) {
        const last:any = segments.length ? segments[segments.length - 1] : null;
        let index: number | null = null;
        if (last === "-" || !isNaN(index = +last)) segments.pop();
        const path = segments.join("/");

        let array = JsonPointer.get(result, path);
        if (array === undefined) {
            array = [];
            JsonPointer.set(result, path, array);
        }
        if (Array.isArray(array)) {
            if (index === null) array.pop();
            else array.splice(index, 1);
            return result;
        }
        else throw "Can not remove value from non-array path";
    }
}