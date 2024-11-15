import { Component, forwardRef, input, computed, Type, viewChild, effect, signal, SimpleChanges } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { DataTableComponent, DataTableModule, resolveDataListInputsFor } from "@upupa/table";
import { ClientDataSource, DataAdapter } from "@upupa/data";
import { DynamicComponent, InputBaseComponent, PortalComponent } from "@upupa/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Class } from "@noah-ark/common";

@Component({
    selector: "array-input",
    templateUrl: "./array-input.component.html",
    standalone: true,
    imports: [DataTableModule, PortalComponent, MatFormFieldModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ArrayInputComponent),
            multi: true,
        },
    ],
})
export class ArrayInputComponent<T = any> extends InputBaseComponent<T[]> {
    dataTableEl = viewChild(DataTableComponent);
    label = input("");
    readonly dataSource = new ClientDataSource<T>([]);
    readonly adapter = signal(new DataAdapter<T>(this.dataSource));

    tableHeaderComponent = input<DynamicComponent, Type<any> | DynamicComponent>(undefined, {
        transform: (c) => {
            if (c instanceof Type) return { component: c };
            return c;
        },
    });
    viewModel = input<Class>();
    columns = computed(() => {
        const vm = this.viewModel();
        if (typeof vm === "function") return resolveDataListInputsFor(vm)?.columns || {};
        return {};
    });

    updateValueFromDataSource() {
        const v = this.dataSource.all;
        this.control().setValue(v);
        this.value.set(v);
        this.markAsTouched();
        this.propagateChange();
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes["value"]) {
            this.dataSource.all = this.value();
        }
    }
    override writeValue(value: T[]): void {
        super.writeValue(value);
        // check if the value is an array and if it is not, throw an error
        if (value && !Array.isArray(value)) {
            throw new Error("ArrayInputComponent can only be used with array values");
        }
        this.dataSource.all = value;
        console.log(this.name(), "ArrayInputComponent -> writeValue -> value", this.adapter().normalized(), this.control().value);
    }
}
