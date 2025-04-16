import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { ChangeDetectionStrategy, Component, forwardRef, input, model, output, runInInjectionContext } from "@angular/core";
import { ControlValueAccessor, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { FloatLabelType, MatError, MatFormField, MatFormFieldAppearance, MatLabel, MatSuffix } from "@angular/material/form-field";

import { MatInput } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { DataComponentBase } from "@upupa/table";
import { MatChipGrid, MatChipInput, MatChipRow } from "@angular/material/chips";
import { MatIcon } from "@angular/material/icon";
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from "@angular/material/autocomplete";
import { DataAdapter } from "@upupa/data";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
    selector: "mat-form-chips-input",
    templateUrl: "./chips-input.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatChipsComponent),
            multi: true,
        },
        {
            provide: DataAdapter,
            useFactory: (self: MatChipsComponent) => self.adapter(),
            deps: [MatChipsComponent],
        },
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: forwardRef(() => MatChipsComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        MatFormField,
        MatInput,
        MatLabel,
        MatChipGrid,
        MatChipInput,
        MatAutocomplete,
        MatChipRow,
        MatIcon,
        MatAutocompleteTrigger,
        MatProgressSpinner,
        MatSuffix,
        MatOption,
        MatError,
        ErrorsDirective,
    ],
    styleUrls: ["./chips-input.component.scss"],
})
export class MatChipsComponent<T = any> extends DataComponentBase implements ControlValueAccessor {
    appearance = input<MatFormFieldAppearance>("outline");
    floatLabel = input<FloatLabelType>("auto");
    label = input("");
    name = input("");
    placeholder = input("");

    text = model("");

    removable = input(true);
    separatorKeysCodes = input([ENTER, COMMA]);

    canAdd = input(true);
    add = output<string>();
    autoComplete = input(true);

    _applyFilter() {
        this.adapter().load({
            filter: {
                ...this.adapter().filter(),
                search: this.text(),
            },
        });
    }

    text$ = toObservable(this.text).pipe(debounceTime(500), distinctUntilChanged());
    constructor() {
        super();
        this.text$.pipe(takeUntilDestroyed()).subscribe(() => this._applyFilter());
    }

    async onAddChip(value: string) {
        if (!this.canAdd()) return;

        try {
            runInInjectionContext(this.injector, () => {
                this.add.emit(value);
            });
            this.text.set("");
        } catch (error) {}
    }
}
