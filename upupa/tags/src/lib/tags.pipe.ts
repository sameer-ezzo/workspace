import { Pipe, inject } from "@angular/core";
import { TagsService } from "./tags.service";
import { map } from "rxjs";
import { AsyncPipe } from "@angular/common";

@Pipe({
    name: "tags",

    pure: false,
})
export class TagsPipe {
    private readonly tagsService = inject(TagsService);
    private readonly _asyncPipe = inject(AsyncPipe);

    transform(obj: unknown): any {
        const ids = (Array.isArray(obj) ? obj : [obj]).filter((v) => !!v);
        const rx = this.tagsService._get().pipe(
            map(() =>
                this.tagsService
                    .getTagsByIds(ids)
                    .map((t) => t?.name ?? "")
                    .join(", "),
            ),
        );

        return this._asyncPipe.transform(rx);
    }
}

// export class TagsPipe extends AsyncPipe {
//     private readonly tagsService = inject(TagsService)

//     private _rx: Observable<string> | null = null;

//     override transform<T>(obj: Observable<T> | Subscribable<T> | Promise<T>): any;
//     override transform<T>(obj: null): any;
//     override transform<T>(obj: Observable<T> | Subscribable<T> | Promise<T>): any;
//     override transform(obj: unknown): any {
//         console.log('TagsPipe.transform() called', obj);

//         if (this._rx) return super.transform(this._rx)
//         const ids = (Array.isArray(obj) ? obj : [obj]).filter(v => !!v)
//         this._rx = this.tagsService.getTags()
//             .pipe(
//                 map(() => this.tagsService.getTagsByIds(ids).map(t => t?.name ?? '').join(', ')),
//                 tap(v => console.log('Got Tags: ',v))
//             )

//         return super.transform(this._rx)
//     }

// }
