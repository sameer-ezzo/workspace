import { Component, Input, forwardRef, SimpleChanges } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EventBus } from '@upupa/common';
import { SelectComponent } from '../select/select.component';
@Component({
  selector: 'form-choices',
  templateUrl: './choices.component.html',
  styleUrls: ['./choices.component.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ChoicesComponent), multi: true },
  { provide: NG_VALIDATORS, useExisting: forwardRef(() => ChoicesComponent), multi: true }

  ]
})
export class ChoicesComponent extends SelectComponent {
  @Input() direction: 'horizontal' | 'vertical' = "horizontal";
  @Input() template: 'normal' | 'thumbs' = "normal";
  @Input() thumbSize = 75;
  @Input() renderer: 'markdown' | 'html' | 'none' = 'none';


  constructor(private _bus: EventBus) {
    super(_bus);
  }

  override async ngOnChanges(changes: SimpleChanges) {
    await super.ngOnChanges(changes);
    if (changes['thumbSize']) {
      this.thumbSize = Math.max(75, isNaN(+this.thumbSize) ? +this.thumbSize : 0);
    }
  }
}