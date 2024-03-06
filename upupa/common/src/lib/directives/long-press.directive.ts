

import { Directive, Output, EventEmitter, HostListener, Input, NgZone, ViewContainerRef } from '@angular/core';


@Directive({ selector: '[long-press]' })
export class LongPressDirective {

    @Input() duration: number = 300;
    @Output('long-press') onLongPress: EventEmitter<MouseEvent> = new EventEmitter();

    constructor(private ngZone: NgZone, private viewRef: ViewContainerRef) { }

    //after view host html element is created, subscribe to mousemove
    ngAfterViewInit() {
        this.ngZone.runOutsideAngular(() => {
            const docElement = this.viewRef.element.nativeElement as HTMLElement

            docElement.addEventListener('mousemove', this.onMouseMove.bind(this))
            docElement.addEventListener('mouseup', this.onMouseUp.bind(this))
            docElement.addEventListener('mousedown', this.onMouseDown.bind(this))

            docElement.addEventListener('touchmove', this.onTouchMove.bind(this))
            docElement.addEventListener('touchstart', this.onTouchstart.bind(this))
            docElement.addEventListener('touchend', this.onTouchend.bind(this))
        });
    }





    onMouseUp() { this.endPress(); }
    onMouseDown(event: MouseEvent) {
        if (event.which !== 1) return; // don't do right/middle clicks
        this.startPress(event);
    }
    onMouseMove() { this.endPress() }



    onTouchstart(event: any) { this.startPress(event); }
    onTouchend() { this.endPress(); }
    onTouchMove() { this.endPress() }


    private _timeoutRef: any;
    startPress(event: MouseEvent) {
        this._timeoutRef = setTimeout(() => {
            this.onLongPress.emit(event);
        }, this.duration);
    }

    endPress() { clearTimeout(this._timeoutRef); }
}

