import { Directive, ElementRef, EventEmitter, Output } from "@angular/core";


@Directive({
  selector: '[focusleave]',
  host: {
    '(focusout)': 'focusout($event)'
  }

})
export class FocusLeaveDirective {
  @Output() focusleave = new EventEmitter<FocusEvent>();

  constructor(public host: ElementRef) { }

  focusout(event: FocusEvent) {
    if (!this.host.nativeElement.matches(':focus-within')) {
      this.focusleave.emit(event);
    }
  }
}