import { inject, Injectable } from "@angular/core";
import { DataService } from "@upupa/data";
import { ObjectId } from "@upupa/data";
import { firstValueFrom, Observable, of } from "rxjs";
import { slugify } from "@noah-ark/common";

import { map, shareReplay, tap } from "rxjs/operators";
import { Tag } from "./tag.model";

function constructPath(p) {
    return (p || "")
        .split("/")
        .map((x) => x.trim())
        .filter((x) => x.length)
        .join("/");
}
@Injectable({ providedIn: "root" })
export class TagsService {
    private readonly dataService = inject(DataService);

    private readonly tagsMap: Map<string, Tag[]> = new Map();
    private readonly idTagMap: Map<string, Tag> = new Map();
    private readonly slugTagMap: Map<string, Tag> = new Map();

    _get(filter?: Record<string, unknown>): Observable<Tag[]> {
        return this.dataService.get<any>(`/tag`, filter).pipe(
            map((res) => res.data as Tag[]),
            tap((tags: Tag[]) => {
                tags.forEach((tag: Tag) => {
                    this.idTagMap.set(tag._id, tag);
                    this.slugTagMap.set(tag.slug, tag);
                });
            }),
            shareReplay(1),
        );
    }
    getChildrenOf(parentPath: string): Observable<Tag[]> {
        parentPath = constructPath(`/${parentPath}`);

        const tags = this.tagsMap.get(parentPath) ?? [];
        if (tags.length) return of(tags);
        const filter = { parentPath: `${parentPath}*` };
        return this._get(filter).pipe(tap((tags: Tag[]) => this.tagsMap.set(parentPath, tags)));
    }

    getByPath(path: string): Observable<Tag | null> {
        path = constructPath(`/${path}`);

        const tag = (this.tagsMap.get(path) ?? []).find((x) => x.parentPath === path);
        if (tag) return of(tag);
        const filter = { parentPath: path };
        return this._get(filter).pipe(map((res) => res?.[0] ?? null));
    }

    getTagById(id: string) {
        return this.idTagMap.get(id);
    }
    getTagsByIds(ids: string[]) {
        return ids.map((id) => this.getTagById(id));
    }

    getTagByName(name: string) {
        return this.tagsMap.get(name);
    }
    getTagsByNames(names: string[]) {
        return names.map((n) => this.getTagByName(n));
    }

    convertNameToId(name: string) {
        const n = (name || "").trim();
        return n.length > 0 ? slugify(n) : ObjectId.generate();
    }

    async getTagByPath(path: string): Promise<Tag> {
        return firstValueFrom(this.getByPath(path));
    }

    async saveTag(tag: Tag, parentPath?: string): Promise<Tag> {
        const slug = tag.slug ? tag.slug : this.convertNameToId(tag.name);
        const post = { ...tag, slug } as Tag;
        parentPath = constructPath(parentPath ? parentPath : (tag.parentPath ?? "/"));
        post.parentId = post.parentId ? post.parentId : (await this.getTagByPath(parentPath))?._id;
        post.parentPath = parentPath;
        post._id ??= ObjectId.generate();

        await this.dataService.put(`/tag/${post._id}`, post);

        this.tagsMap.set(parentPath, [...(this.tagsMap.get(parentPath) ?? []), post]);
        this.idTagMap.set(post._id, post);

        return post;
    }

    async removeTag(tag: Tag) {
        try {
            //todo: remove all children and sub children...
            await this.dataService.delete(`tag/${tag._id}`);
            // this.tagsMap.delete(data.name)
            // this.tags = Array.from(this.tagsMap)
        } catch (err) {
            console.error(err);
        }
    }
}
