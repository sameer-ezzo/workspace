import { Component, forwardRef, OnDestroy, OnChanges, OnInit, input, model, SimpleChanges, computed, Type } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DataTableModule, resolveDataListInputsFor, ValueDataComponentBase } from '@upupa/table';
import { ClientDataSource, DataAdapter } from '@upupa/data';
import { DynamicComponent, PortalComponent } from '@upupa/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AsyncPipe, JsonPipe } from '@angular/common';
// import { Class, resolveDataListInputsFor } from '@upupa/cp';

@Component({
    selector: 'array-input',
    templateUrl: './array-input.component.html',
    standalone: true,
    imports: [DataTableModule, PortalComponent, MatFormFieldModule, AsyncPipe, JsonPipe],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ArrayInputComponent),
            multi: true,
        },
    ],
})
export class ArrayInputComponent<T = any> extends ValueDataComponentBase<T> implements OnDestroy, OnChanges, OnInit {
    label = input('');
    tableHeaderComponent = input<DynamicComponent, Type<any> | DynamicComponent>(undefined, {
        transform: (c) => {
            if (c instanceof Type) return { component: c };
            return c;
        },
    });
    viewmodel = input<any>();
    columns = computed(() => {
        const cols = resolveDataListInputsFor(this.viewmodel())?.columns || {};
        return cols;
    });

    dataSource = new ClientDataSource([]);
    private readonly _adapter = new DataAdapter(this.dataSource);
    override adapter = model(this._adapter);

    override async ngOnChanges(changes: SimpleChanges): Promise<void> {
        if (changes['adapter']) {
            this.dataSource.all = this.value() as Partial<T>[];
            this.adapter().refresh();
            console.log('ArrayInputComponent.ngOnChanges Adapter', this.adapter().normalized);
            this.adapter.set(this._adapter);
        }
        await super.ngOnChanges(changes);
    }
}
