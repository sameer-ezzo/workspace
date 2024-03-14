export class PathInfo {

    constructor(public path: string, public collection: string) { }

    base?: string;
    id?: string;
    pointer?: string;
    criteria?: { key: string, value: string }[];
    index?: number;
    projectionPath?: string;
    segments?: string[];

    static segments(p: string) {
        const qpsIdx = p.indexOf('?')
        return p.substring(0, qpsIdx > -1 ? qpsIdx : p.length).split("/").filter(s => s).map(s => s.trim());
    }

    static toPath(segments: string[]): string {
        return '/' + segments.filter(x => x).join('/');
    }

    static parse(p: string, baseSegment = 0): PathInfo {
        const segments = PathInfo.segments(p);
        let base = '';
        while (baseSegment > 0) {
            base += '/' + segments.shift();
            baseSegment--;
        }
        const ss = segments.slice();
        let query: string;
        [p, query] = p.split("?");

        const path = segments.join("/");
        const collection = segments.shift();
        if (!collection) { throw "INVALID_PATH"; }
        const id = segments.length ? segments.shift() : undefined;
        const pointer = segments.length ? '/' + segments.join("/") : undefined;
        const projectionPath = segments.length ? segments.filter(s => isNaN(+s)).join(".") : undefined;

        let criteria: { key: string, value: string }[] = [];
        if (query) {
            criteria = query.split("&")
                .filter(q => q)
                .map(q => {
                    let key: string, value: string;
                    [key, value] = q.split("=");
                    return { key, value };
                });
        }

        return { path, collection, id, projectionPath, pointer, criteria, segments: ss };
    }

    static getProjectionPath(p: PathInfo) {
        if (!p.pointer) return undefined;
        const segments = p.pointer.split("/").filter(s => s != null && s.length > 0 && isNaN(+s)).map(s => s.trim());
        return segments.length ? segments.join(".") : undefined;
    }


}
export class ArrayPath {
    path!: string;
    index?: number;

    static parse(path: string): ArrayPath {
        const segments = path.split("/")
            .filter(s => s != null && s.length > 0)
            .map(s => s.trim());

        const index = isNaN(+segments[segments.length - 1]) ? undefined : +segments[segments.length - 1];
        if (index != undefined) {
            segments.pop();
        }

        return { path: `/${segments.join("/")}`, index };
    }
}