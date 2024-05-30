import { ChangeDetectorRef, Pipe, inject } from "@angular/core";
import { TagsService } from "./tags.service";
import { BehaviorSubject, Subscription, firstValueFrom } from "rxjs";

@Pipe({
    name: 'tags',
    standalone: true
})
export class TagsPipe {
    private readonly tagsService = inject(TagsService)
    private readonly ref = inject(ChangeDetectorRef)
    private subscription: Subscription | null = null;
    private value$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    transform(value: any, ...args: any[]): any {
        this.subscription?.unsubscribe();
        if(!value) return this.value$.next('')
        this.subscription = this.tagsService.getTags().subscribe({
            next: () => {
                const v = typeof Array.isArray(value) ?
                    this.tagsService.getTagsByIds(value).map(t => t?.name || '').filter(t => t.length).join(', ') :
                    this.tagsService.getTagById(value)?.name || ''
                this.value$.next(v)
            },
            error: err => {
                console.error(err)
                this.value$.next('')
            }
        })

        return this.value$;

    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

}