import {
    Component,
    Input,
    forwardRef,
    Output,
    EventEmitter,
    SimpleChanges,
    input,
    computed,
} from '@angular/core';
import {
    ControlValueAccessor,
    UntypedFormControl,
    NG_VALUE_ACCESSOR,
    NG_VALIDATORS,
} from '@angular/forms';
import { InputBaseComponent } from '@upupa/common';
import { ReplaySubject } from 'rxjs';
import { InputDefaults } from '../../defaults';

export type Range<T> = { from: T; to: T };
function nullEmptyCheck(v) {
    return v === null || v === '';
}
// https://angular-slider.github.io/ngx-slider/demos
@Component({
    selector: 'form-numbers-range',
    templateUrl: './numbers-range.component.html',
    styleUrls: ['./numbers-range.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NumbersRangeComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => NumbersRangeComponent),
            multi: true,
        },
    ],
})
export class NumbersRangeComponent<T = number> extends InputBaseComponent {
    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    label = input('');
    placeholder = input('');
    hint = input('');


    floor = input(0);
    ceiling = input(100);
    step = input(1);

    pushRange = input(false);
    showSelectionBar = input(true);

    //@Input() selectionBarGradient: { from: string, to: string };
    //@Input() getSelectionBarColor: (value: number) => string;
    //@Input() getPointerColor: (value: number) => string;

    thumbSize = input(75, {
        transform: (v: number) => Math.max(5, v),
    });

    from: any;
    to: any;

    _items = [];
    _options: {
        floor: number;
        ceil: number;
        step: number;
        minLimit: any;
        maxLimit: any;
    };

    options = computed(() => {
        return {
            floor: this.floor(),
            ceil: this.ceiling(),
            step: this.step(),
            minLimit: this.floor(),
            maxLimit: this.ceiling(),
        };
    });

    items = computed(() => {
        return new Array(this.ceiling() - this.floor())
            .fill(0)
            .map((_, i) => i);
    });

    // override propagateChange() {

    //   // if (this.from > this.to || nullEmptyCheck(this.from) || nullEmptyCheck(this.to)) this._value = undefined;
    //   // else this._value = { from: this.from, to: this.to }

    //   this._value = { from: this.from, to: this.to }

    //   const value = this._value;
    //   if (this._onChange) this._onChange(value); //ngModel/ngControl notify (value accessor)
    //   if (this.control) this.control.setValue(value); //control notify
    //   this.valueChange.emit(value); //value event binding notify
    //   this.value$.next(value); //template reference #component.value$ | async

    // };

    // override _updateViewModel() {
    //     if (this._value) {
    //         this.from = this._value.from;
    //         this.to = this._value.to;
    //     } else {
    //         this.from = undefined;
    //         this.to = undefined;
    //     }
    // }
}
