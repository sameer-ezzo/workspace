import { Pipe, ChangeDetectorRef, OnDestroy } from '@angular/core'
import { TranslateService } from './translate.service'
import { AsyncPipe } from '@angular/common'
import { Observable, Subscription } from 'rxjs'


@Pipe({
    name: 'text', pure: false
})
export class TextPipe implements OnDestroy {
    _rx: Observable<string>
    _async: AsyncPipe

    constructor(public translate_service: TranslateService, _ref: ChangeDetectorRef) {
        this._async = new AsyncPipe(_ref)
    }
    transform(value: string | undefined, ...params: string[]): any {
        this._rx = this.translate_service.translate$(value, ...params)
        return this._async.transform(this._rx)
    }
    ngOnDestroy(): void {
        this._async.ngOnDestroy()
    }
}