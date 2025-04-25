export interface Tag {
    _id: string;
    slug: string;
    name: string;
    path: string;
    parentPath: string;
    parentId: string;
    description?: string;
    order?: number;
    class?: string;
    meta?: Record<string, unknown>;
    translations?: Record<string, unknown>;
}
