import { ChangeDetectionStrategy, Component, effect, EffectRef, ElementRef, forwardRef, input, viewChild } from "@angular/core";
import { FormsModule, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { DataAdapter } from "@upupa/data";

import { DataComponentBase } from "@upupa/table";
import { InputDefaults } from "../defaults";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    standalone: true,
    selector: "mat-form-autocomplete-text-input",
    templateUrl: "./autocomplete-text.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, MatAutocompleteModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatAutoCompleteTextComponent),
            multi: true,
        },
        {
            provide: DataAdapter,
            useFactory: (self: MatAutoCompleteTextComponent) => self.adapter(),
            deps: [MatAutoCompleteTextComponent],
        },
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: forwardRef(() => MatAutoCompleteTextComponent),
            multi: true,
        },
    ],
})
export class MatAutoCompleteTextComponent extends DataComponentBase {
    name = input("");
    inlineError = true;
    override multiple = input<boolean>(false);
    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    label = input("");
    panelClass = input("");
    placeholder = input("");
    hint = input("");

    _onlySelected = false;

    _searchRequest$ = new Subject<string>();
    _search$ = this._searchRequest$.pipe(debounceTime(300), distinctUntilChanged());

    readonly displayInput = viewChild<ElementRef>("displayInput");
    _initialized: EffectRef = undefined as EffectRef;
    constructor() {
        super();
        this._search$.pipe(takeUntilDestroyed()).subscribe(async (value) => {
            this._doSearch(value);
        });

        effect(() => {
            // this short effect is responsible for updating the display input value from the current input value
            // if this is not present the input value will not be reflected in the display input for the first time the control is opened in edit mode.
            const displayInput = this.displayInput();
            const v = this.value();
            const keys = this.adapter().getKeysFromValue(v);
            const display = (keys.length > 0 ? this.displayOfKey(keys?.[0] as string) : v) ?? "";
            displayInput.nativeElement.value = display;
        });
    }

    _search(value: string) {
        this._searchRequest$.next(value);

        const keys = this.adapter().getKeysFromValue(value as any);
        const v = keys.length > 0 ? this.displayOfKey(keys?.[0] as string) : value;
        this.selectByKey(v);
    }

    _doSearch(value: string) {
        return this.adapter().load({ filter: { search: value } });
    }

    displayOfKey(key: string): string {
        const item = this.adapter()
            .normalized()
            .find((x) => x.key === key);

        if (item) return item.display as unknown as string;
        return key as string;
    }
    selectByKey(key: string) {
        const item = this.adapter()
            .normalized()
            .find((x) => x.key === key);
        const v = item ? (item.value ?? key) : key;
        this.select(Array.isArray(v) ? v : [v], { clearSelection: true, emitEvent: true });
    }
}
