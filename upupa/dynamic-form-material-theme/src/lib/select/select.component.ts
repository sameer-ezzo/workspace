import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, TemplateRef, ViewEncapsulation, forwardRef, input, model, viewChild } from "@angular/core";
import { FormControl, FormsModule, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validator } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { ActionDescriptor, ErrorsDirective, FocusDirective } from "@upupa/common";
import { DataComponentBase } from "@upupa/table";
import { debounceTime } from "rxjs";
import { InputDefaults } from "../defaults";
import { DataAdapter } from "@upupa/data";

@Component({
    imports: [
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule,
        FocusDirective,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        CommonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        ErrorsDirective,
    ],
    selector: "mat-form-select-input",
    templateUrl: "./select.component.html",
    styleUrls: ["./select.component.scss"],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatSelectComponent),
            multi: true,
        },
        {
            provide: NG_ASYNC_VALIDATORS,
            useExisting: forwardRef(() => MatSelectComponent),
            multi: true,
        },
        {
            provide: DataAdapter,
            useFactory: (self: MatSelectComponent) => self.adapter(),
            deps: [MatSelectComponent],
        },
    ],
})
export class MatSelectComponent<T = any> extends DataComponentBase<T> implements Validator {
    selectInput = viewChild<MatSelect>(MatSelect);
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

    clearValue(e) {
        e.stopPropagation();
        this.select(undefined, { clearSelection: true });
    }

    @Output() action = new EventEmitter<ActionDescriptor>();
    @Input() actions: ActionDescriptor[] = [];
    onAction(event: any, action: ActionDescriptor) {
        event.stopPropagation();
        this.action.emit(action);
    }
}
