import { CommonModule } from "@angular/common";
import { Component, forwardRef, SimpleChanges } from "@angular/core";
import {
    NG_VALUE_ACCESSOR,
    FormsModule,
    ReactiveFormsModule,
    FormGroup,
    FormControl,
    ValueChangeEvent,
    PristineChangeEvent,
    TouchedChangeEvent,
    FormResetEvent,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { InputBaseComponent } from "@upupa/common";
import { startWith } from "rxjs";

@Component({
    selector: "mat-form-numbers-range-input",
    template: ``,
    styles: ``,
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RangeInputBaseComponent), multi: true }],
    imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule],
})
export class RangeInputBaseComponent<T = unknown> extends InputBaseComponent<T> {
    readonly rangeForm = new FormGroup({
        start: new FormControl<T | null | undefined>(null),
        end: new FormControl<T | null | undefined>(null),
    });

    ngOnInit(): void {
        this._bindControl();
        this.rangeForm.events.subscribe((e) => {
            if (e instanceof ValueChangeEvent && e.value !== this.value()) {
                const value = e.value;
                this.handleUserInput(value);
            }
            // PristineChangeEvent
            else if (e instanceof PristineChangeEvent) {
                this.control()?.markAsPristine();
            }
            // TouchedChangeEvent
            else if (e instanceof TouchedChangeEvent) {
                this.markAsTouched();
            } else if (e instanceof FormResetEvent) {
                this.control()?.reset();
            }
        });
    }
    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        await super.ngOnChanges(changes);
        if (changes["control"] && this.control()) {
            this._bindControl();
        }
        if (changes["value"]) {
            this.rangeForm.patchValue(this.value(), {
                emitEvent: false,
                onlySelf: true,
            });
        }
    }
    private bindSubscription: any;
    private _bindControl() {
        this.bindSubscription?.unsubscribe();
        this.bindSubscription = this.control()
            .events.pipe(startWith(new ValueChangeEvent(this.control().value, this.control())))
            .subscribe((e) => {
                if (e instanceof ValueChangeEvent && e.value !== this.rangeForm.value) {
                    const value = e.value;
                    this.rangeForm.patchValue(value, { emitEvent: false, onlySelf: true });
                }
            });
    }
}
