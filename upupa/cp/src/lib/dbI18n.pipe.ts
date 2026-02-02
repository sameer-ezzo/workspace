import { AsyncPipe } from "@angular/common"
import { Pipe, PipeTransform, inject } from "@angular/core"
import { LanguageService } from "@upupa/language"
import { map } from "rxjs"

@Pipe({
    name: '_i18n',
    
    pure: false
})

export class DbI18nPipe implements PipeTransform {
    private readonly language = inject(LanguageService)
    private readonly _asyncPipe = inject(AsyncPipe)

    transform(obj: any): any {
        if (!obj) return obj
        if (Array.isArray(obj)) return obj
        if (typeof obj !== 'object') return obj

        const rx = this.language.language$.pipe(
            map((lang: string) => obj?.[lang])
        )
        return this._asyncPipe.transform(rx);
    }
}