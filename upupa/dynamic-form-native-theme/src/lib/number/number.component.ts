import { Component, DestroyRef, Input, forwardRef, inject } from '@angular/core';
import { UntypedFormControl, NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { InputDefaults } from '../defaults';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';



@Component({
  selector: 'form-number',
  templateUrl: './number.component.html',
  styleUrls: ['./number.component.scss'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NumberComponent), multi: true, },
  { provide: NG_VALIDATORS, useExisting: forwardRef(() => NumberComponent), multi: true }

  ]
})
export class NumberComponent extends InputBaseComponent {
  inlineError = true;

  @Input() appearance = InputDefaults.appearance;
  @Input() floatLabel = InputDefaults.floatLabel;
  @Input() placeholder: string;

  @Input() label: string;
  @Input() hint: string;
  @Input() readonly = false;
  @Input() errorMessages: { [errorCode: string]: string } = {};

  @Input() required: boolean;

  @Input() min: number = null;
  @Input() max: number = null;


  // add input to tell the component about the number type (integer, float, double, etc)
  @Input() numberType: 'integer' | 'float' | 'double' = 'float';
  // override _updateViewModel() {
  //   super._updateViewModel();
  //   this.fixNumberType(this.value);
  // }
  private readonly destroyRef = inject(DestroyRef);
  ngAfterViewInit() {
    this.control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.fixNumberType(value);
      });
  }

  private readonly fixNumberType = (value: any) => {
    if (value === null || value === undefined) return
    if (this.numberType === 'integer') this._value = parseInt(value, 10);
    else this._value = parseFloat(value);
  }

}

