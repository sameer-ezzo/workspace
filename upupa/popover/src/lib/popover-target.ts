import { Directive, ElementRef } from '@angular/core';


@Directive({
  selector: 'popover-target, [popoverTarget]',
  exportAs: 'popoverTarget',
  standalone: true,
})
export class PopoverTarget { // tslint:disable-line:directive-class-suffix

  constructor(public _elementRef: ElementRef) { }

}
