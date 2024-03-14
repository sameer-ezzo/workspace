


export class Patch {
    op!: "replace" | "add" | "remove";
    path!: string;
    value?: string | any;
}