

export class Patch {
    op: "replace" | "add" | "remove" = "replace";
    path = "/";
    value?: any;
}

export class DataChange {
    _id?: string;
    constructor(public path: string, public date: Date, public lastChange: Date) { }
    patches: Patch[] = [];
    user?: any;
}