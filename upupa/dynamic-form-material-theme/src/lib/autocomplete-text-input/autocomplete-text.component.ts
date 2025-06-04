import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, forwardRef, input } from "@angular/core";
import { FormsModule, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ErrorsDirective } from "@upupa/common";
import { DataAdapter } from "@upupa/data";

import { DataComponentBase } from "@upupa/table";
import { InputDefaults } from "../defaults";
import { debounceTime, distinctUntilChanged, Subject, switchMap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
    standalone: true,
    selector: "mat-form-autocomplete-text-input",
    templateUrl: "./autocomplete-text.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, ErrorsDirective, CommonModule, MatAutocompleteModule],
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
export class MatAutoCompleteTextComponent extends DataComponentBase<string> {
    name = input("");
    inlineError = true;

    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    label = input("");
    panelClass = input("");
    placeholder = input("");
    hint = input("");

    _onlySelected = false;

    _searchRequest$ = new Subject<string>();
    _search$ = this._searchRequest$.pipe(debounceTime(300), distinctUntilChanged());

    constructor() {
        super();
        this._search$.pipe(takeUntilDestroyed()).subscribe((value) => {
            this._doSearch(value);
        });
    }

    _search(value: string) {
        this._searchRequest$.next(value);
    }

    _doSearch(value: string) {
        return this.adapter().load({ filter: { search: value } });
    }
}
