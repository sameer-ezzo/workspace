import { Component, ViewChild, Input, ChangeDetectionStrategy, Output, EventEmitter } from "@angular/core";
import { DynamicFormComponent, DynamicFormModule, Field, FormScheme } from "@upupa/dynamic-form";
import { InputBaseComponent } from "@upupa/common";
import { Condition } from "@noah-ark/expression-engine";
import { ReplaySubject, debounceTime } from "rxjs";
import { getNestedValue } from "../filter.types";
import { ToFilterDescriptor } from "../../types";
import { FilterDescriptor } from "@upupa/data";

@Component({
    selector: "cp-data-filter-form",
    standalone: true,
    imports: [DynamicFormModule],
    templateUrl: "./data-filter-form.component.html",
    styleUrls: ["./data-filter-form.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataFilterFormComponent extends InputBaseComponent<Record<string, any>> {
    @ViewChild("dynForm") form: DynamicFormComponent;
    @Input() fields!: FormScheme;
    @Input() conditions: Condition[] = [];
    @Input() toFilterDescriptor!: ToFilterDescriptor;
    @Input() filterChangeDebounceTime = 1000;
    filter: FilterDescriptor | null = null;
    @Output() filterChanged = new EventEmitter<FilterDescriptor | null>();

    valueChange$ = new ReplaySubject<any>(1);
    constructor() {
        super();
        this.valueChange$.pipe(debounceTime(Math.max(0, this.filterChangeDebounceTime ?? 0))).subscribe((x) => this._formValueChangeHandler(x));
    }

    clearFilter() {
        this.value = null;
        this.valueChange$.next(null);
    }

    private _formValueChangeHandler(value: any) {
        const form = this.form;
        if (!form) return;
        if (form.invalid) {
            form.markAsTouched();
            form.scrollToError();
            return;
        }

        const toFilter = this.toFilterDescriptor ?? formSchemeToDynamicFormFilter(this.fields);
        try {
            this.filter = toFilter(value);
            this.filterChanged.emit(this.filter);
        } catch (error) {
            console.error("Error while converting form value to filter descriptor");
            console.error(error);
        }
    }
}

export function formSchemeToDynamicFormFilter(scheme: FormScheme): ToFilterDescriptor {
    const toPath = (...seg: string[]) => seg.filter((p) => p?.trim().length > 0).join(".");

    function fromField(field: Field, value: any, path: string): { [path: string]: string } {
        if (value === null || value === undefined) return { [path]: undefined };
        const { _adapter, adapter } = field.inputs as any;
        let p = path;
        let v = value;
        const res = { [p]: v };
        if (_adapter || adapter)
            if (adapter.keyProperty) {
                p = toPath(path, adapter.keyProperty);
                v = (value ?? [])
                    .map((x) => x[adapter.keyProperty] || x)
                    .filter((c) => c)
                    .join("|");
            } else {
                v = (value ?? []).filter((c) => c).join("|");
            }
        else res[path] = value ?? [];

        if (v === "" || v === undefined) return { [p]: undefined };
        return { [p]: v };
    }

    function fromFieldSet(items: FormScheme, value: any, path: string): FilterDescriptor {
        let fd: FilterDescriptor = {};

        for (const [name, field] of Object.entries(items)) {
            if (field.type === "page-breaker") continue;

            const v = getNestedValue(value, [name]);
            if (field.type === "fieldset" || field.type === "array") {
                fd = { ...fd, ...fromFieldSet(field.items, v, toPath(path, name)) };
            } else fd = { ...fd, ...fromField(field, v, toPath(path, name)) };
        }
        return fd;
    }

    return (value: Record<string, any>) => {
        let fd: FilterDescriptor = {};
        if (value === null || value === undefined) return fd;
        fd = { ...fromFieldSet(scheme, value, "") };
        return fd;
    };
}
