import { Component, forwardRef, OnDestroy, input, computed, Type, effect, signal } from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { DataTableModule, resolveDataListInputsFor, ValueDataComponentBase } from "@upupa/table";
import { ClientDataSource, DataAdapter } from "@upupa/data";
import { DynamicComponent, InputBaseComponent, PortalComponent } from "@upupa/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Class } from "@noah-ark/common";
import { skip, Subscription } from "rxjs";

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
export class ArrayInputComponent<T = any> extends ValueDataComponentBase<T> {
    label = input("");
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

    dataSource = new ClientDataSource([]);
    dataChangedSub$: Subscription;

    ngOnInit() {
        this.dataChangedSub$ = this.adapter()
            .normalized$.pipe(skip(1))
            .subscribe((all) => {
                const v = all.map((x) => x.item);
                if (this.value() === v) return;
                // this.control().setValue(v);
            });
    }

    ngOnDestroy(): void {
        this.dataChangedSub$?.unsubscribe();
    }

    override writeValue(value: T[]): void {
        // check if the value is an array and if it is not, throw an error
        if (value && !Array.isArray(value)) {
            throw new Error("ArrayInputComponent can only be used with array values");
        }
        this.value.set(value);

        this.dataSource.all = value ?? [];
    }
}
