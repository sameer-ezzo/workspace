import { ChangeDetectorRef, Pipe, inject } from "@angular/core";
import { TagsService } from "./tags.service";
import { Observable, Subscribable, map, tap } from "rxjs";
import { AsyncPipe } from "@angular/common";

@Pipe({
    name: 'tags',
    standalone: true,
    pure: false
})

export class TagsPipe {
    private readonly tagsService = inject(TagsService)
    private readonly _asyncPipe = inject(AsyncPipe)
    obs: Observable<string> | null = null;
    transform(obj: unknown): any {
        if (this.obs) return this._asyncPipe.transform(this.obs);
        const ids = (Array.isArray(obj) ? obj : [obj]).filter(v => !!v)
        this.obs = this.tagsService.getTags().pipe(map(() =>
            this.tagsService.getTagsByIds(ids).map(t => t?.name ?? '').join(', ')
        ))

        return this._asyncPipe.transform(this.obs);
    }
}