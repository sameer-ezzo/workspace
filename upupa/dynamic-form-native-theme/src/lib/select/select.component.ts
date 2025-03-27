import { Component, Input, forwardRef, Output, EventEmitter, TemplateRef, ElementRef, input, viewChild, model } from "@angular/core";
import { FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR } from "@angular/forms";
import { ActionDescriptor } from "@upupa/common";
import { DataComponentBase } from "@upupa/table";

import { debounceTime } from "rxjs";
import { InputDefaults } from "../defaults";
import { DataAdapter } from "@upupa/data";

@Component({
    standalone: true,
    selector: "form-select",
    templateUrl: "./select.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SelectComponent),
            multi: true,
        },
        {
            provide: DataAdapter,
            useFactory: (self: SelectComponent) => self.adapter(),
            deps: [SelectComponent],
        },
    ],
})
export class SelectComponent<T = any> extends DataComponentBase<T> {
    name = input("");
    ngAfterViewInit() {
        this.filterControl.valueChanges.pipe(debounceTime(300)).subscribe((v) => {
            const filter = this.adapter().filter();
            const _filter = { ...filter, search: v };
            this.adapter().load({ filter: _filter });
        });
    }

    inlineError = true;
    showSearch = input(false);

    appearance = input(InputDefaults.appearance);
    floatLabel = input(InputDefaults.floatLabel);
    label = input("");
    panelClass = input("");
    placeholder = input("");
    hint = input("");

    valueTemplate = input<TemplateRef<any>>();
    itemTemplate = input<TemplateRef<any>>();

    filterControl = new FormControl<string>("");
    filterInputRef = viewChild.required<ElementRef>("filterInput");
    filterModel = model<string>();

    override multiple = input(false);

    clearValue(e) {
        e.stopPropagation();
        this.selectionModel.clear();
        this.value.set(undefined);
        this.markAsTouched();
        this.propagateChange();
    }

    @Output() action = new EventEmitter<ActionDescriptor>();
    @Input() actions: ActionDescriptor[] = [];
    onAction(event: any, action: ActionDescriptor) {
        event.stopPropagation();
        this.action.emit(action);
    }
}
