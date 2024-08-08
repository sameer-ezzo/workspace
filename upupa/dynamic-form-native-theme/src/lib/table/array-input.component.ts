import {
    Component,
    Input,
    forwardRef,
    Output,
    EventEmitter,
    SimpleChange,
    SimpleChanges,
    OnDestroy,
    OnChanges,
    OnInit,
} from "@angular/core";
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from "@angular/forms";
import {
    ActionDescriptor,
    ActionEvent,
    ActionsDescriptor,
    InputBaseComponent,
} from "@upupa/common";
import { ColumnsDescriptor, TableFormInput } from "@upupa/table";
import { DataAdapter, ClientDataSource } from "@upupa/data";
import { Subject, Subscription, takeUntil } from "rxjs";

@Component({
    selector: "array-input",
    templateUrl: "./array-input.component.html",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => ArrayInputComponent),
            multi: true,
        },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => ArrayInputComponent), multi: true }
    ],
})
export class ArrayInputComponent<T = any> extends TableFormInput<T>
    implements OnDestroy, OnChanges, OnInit {
    dataSource = new ClientDataSource([]);
    override adapter = new DataAdapter<T>(this.dataSource);

    @Input() override columns: ColumnsDescriptor = {};


    @Output() action = new EventEmitter<ActionEvent>();
}
