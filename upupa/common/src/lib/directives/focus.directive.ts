import { isPlatformBrowser } from "@angular/common";
import { Directive, ElementRef, Inject, NgZone, PLATFORM_ID, inject, input } from "@angular/core";

@Directive({
    selector: "[focus]",
    standalone: true,
})
export class FocusDirective {
    readonly focus = input(false);
    readonly focusType = input<"select" | "focus">("select");

    //focus after ngModel change
    private readonly platformId = inject(PLATFORM_ID);
    private readonly zone = inject(NgZone);
    private readonly elementRef = inject(ElementRef);

    private _observer: IntersectionObserver | undefined;
    ngAfterViewInit() {
        if (!isPlatformBrowser(this.platformId)) return;
        if (!this.focus()) {
            this._observer?.disconnect();
            return;
        }
        this._observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.zone.runOutsideAngular(() => {
                        this.doFocus();
                    });
                }
            });
        });
        this._observer.observe(this.elementRef.nativeElement);
    }

    ngOnDestroy() {
        this._observer?.disconnect();
    }

    doFocus() {
        setTimeout(() => {
            switch (this.focusType()) {
                case "select":
                    this.elementRef.nativeElement.select();
                    break;
                case "focus":
                    this.elementRef.nativeElement.focus();
                    break;
            }
        }, 50);
    }
}
