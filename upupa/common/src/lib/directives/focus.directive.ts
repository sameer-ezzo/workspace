

import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, Inject, Input, NgZone, PLATFORM_ID } from '@angular/core';


@Directive({
    selector: '[focus]',
    // standalone: true
})
export class FocusDirective {
    @Input() focus = false
    @Input() focusType?: 'select' | 'focus' = 'select'

    //focus after ngModel change

    constructor(
        @Inject(PLATFORM_ID) private platformId: any,
        private zone: NgZone,
        private elementRef: ElementRef) {

    }


    observer: IntersectionObserver | undefined
    ngAfterViewInit() {
        if (!isPlatformBrowser(this.platformId)) return
        if (!this.focus) {
            this.observer?.disconnect()
            return
        }
        this.observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.zone.runOutsideAngular(() => { this.doFocus() })
                }
            });
        });
        this.observer.observe(this.elementRef.nativeElement);
    }

    ngOnDestroy() {
        this.observer?.disconnect()
    }

    doFocus() {
        setTimeout(() => {
            switch (this.focusType) {
                case 'select':
                    this.elementRef.nativeElement.select();
                    break;
                case 'focus':
                    this.elementRef.nativeElement.focus();
                    break;
            }
        }, 200);
    }

}
