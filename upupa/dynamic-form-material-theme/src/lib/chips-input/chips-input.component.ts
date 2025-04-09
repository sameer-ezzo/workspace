import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { ChangeDetectionStrategy, Component, computed, forwardRef, input, InputSignal, model, output, runInInjectionContext } from "@angular/core";
import { ControlValueAccessor, FormControlDirective, FormsModule, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { FloatLabelType, MatError, MatFormField, MatFormFieldAppearance, MatFormFieldModule, MatLabel, MatSuffix } from "@angular/material/form-field";

import { MatInput, MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { DataComponentBase } from "@upupa/table";
import { MatChipGrid, MatChipInput, MatChipRow, MatChipsModule } from "@angular/material/chips";
import { CommonModule } from "@angular/common";
import { MatIcon, MatIconModule } from "@angular/material/icon";
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteTrigger, MatOption } from "@angular/material/autocomplete";
import { DataAdapter, NormalizedItem } from "@upupa/data";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatIconButton } from "@angular/material/button";

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
        MatIconButton,
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
