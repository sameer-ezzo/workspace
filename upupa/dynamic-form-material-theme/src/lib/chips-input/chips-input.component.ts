import { COMMA, ENTER } from "@angular/cdk/keycodes";
import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, output, runInInjectionContext } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from "@angular/material/form-field";

import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { DataComponentBase } from "@upupa/table";
import { MatChipsModule } from "@angular/material/chips";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { DataAdapter, NormalizedItem } from "@upupa/data";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged } from "rxjs";

@Component({
    standalone: true,
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
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule, MatChipsModule, MatIconModule, MatAutocompleteModule],
})
export class MatChipsComponent<T = any> extends DataComponentBase implements ControlValueAccessor {
    appearance = input<MatFormFieldAppearance>("outline");
    floatLabel = input<FloatLabelType>("auto");
    label = input("");
    name = input("");
    placeholder = input("");

    _items = computed(() => {
        const all = this.items();
        const value = this.value();
        const v = this.adapter().getKeysFromValue(value);
        return all.filter((x) => !v.includes(x.key));
    });
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
