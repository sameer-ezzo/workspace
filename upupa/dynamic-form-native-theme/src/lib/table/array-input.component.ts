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
import { ColumnsDescriptor } from "@upupa/table";
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
export class ArrayInputComponent<T = any>
    extends InputBaseComponent<any[]>
    implements OnDestroy, OnChanges, OnInit {
    dataSource = new ClientDataSource([]);
    adapter = new DataAdapter<T>(this.dataSource);

    @Input() columns: ColumnsDescriptor = {};
    @Input() label: string = undefined;

    @Input() actions: ActionDescriptor[] | ((item: any) => ActionDescriptor[]) = [];

    @Output() action = new EventEmitter<ActionEvent>();
    destroyed$ = new Subject<void>();

    ngOnInit() {
        this.dataSource.data$.pipe(takeUntil(this.destroyed$)).subscribe((data) => {
            if (this.dataSource.all !== this.value) this.value = this.dataSource.all;
        });
    }


    ngOnDestroy() {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    override _updateViewModel() {
        this.dataSource.all = this.value;
        this.adapter.refresh();
    }
}
