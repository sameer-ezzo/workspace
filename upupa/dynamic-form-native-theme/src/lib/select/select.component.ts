import { Component, Input, forwardRef, Output, EventEmitter, TemplateRef, ElementRef, input, viewChild, model, SimpleChanges, computed } from "@angular/core";
import { AbstractControl, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from "@angular/forms";
import { MatSelect } from "@angular/material/select";
import { ActionDescriptor } from "@upupa/common";
import { ValueDataComponentBase } from "@upupa/table";

import { debounceTime } from "rxjs";
import { InputDefaults } from "../defaults";

@Component({
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
    ],
})
export class SelectComponent<T = any> extends ValueDataComponentBase<T> implements Validator {
    noOption() {
        console.log("NOT IMPLEMENTED");
        return false;
    }

    _flag = false;
    validate(control: AbstractControl): ValidationErrors | null {
        if (this._flag && control.value && this.noOption() && this.dataLoaded()) {
            control.markAsTouched();
            const value = control.value._id ?? control.value;
            return {
                select: {
                    message: `No option found matching value "${value}"`,
                },
            };
        }
        return null;
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this._flag = true;
            this.control().updateValueAndValidity();
        }, 500); //todo: wait for adapter data change

        this.filterControl.valueChanges.pipe(debounceTime(300)).subscribe((v) => {
            const filter = this.adapter().filter;
            const _filter = { ...filter, ...(this.adapter().normalizeFilter(v) || {}) };
            this.adapter().filter = _filter;
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

    clearValue(e) {
        e.stopPropagation();
        this.selectionModel.clear();
        this.control().setValue(undefined);
    }

    keyDown(e: KeyboardEvent, input?: { open: () => void; panelOpen: boolean }) {
        // if (!input || input.panelOpen === true) return;
        // const shouldOpen = e.key === "ArrowDown" || (e.key.length === 1 && /[a-z0-9 ]/i.test(e.key));
        // if (shouldOpen) this.openedChange(true);
    }

    isPanelOpened = false;

    async openedChange(open: boolean, input?: { open: () => void }) {
        // this.isPanelOpened = open;
        // console.log("openedChange", open, this.dataLoaded());
        // if (open && !this.dataLoaded()) {
        //     this.loadData();
        // }
    }

    @Output() action = new EventEmitter<ActionDescriptor>();
    @Input() actions: ActionDescriptor[] = [];
    onAction(event: any, action: ActionDescriptor) {
        event.stopPropagation();
        this.action.emit(action);
    }
}
