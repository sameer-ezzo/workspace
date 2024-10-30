import { BreakpointObserver } from '@angular/cdk/layout';
import {
    Component,
    ElementRef,
    forwardRef,
    Inject,
    input,
    Input,
    model,
    OnChanges,
    OnInit,
    SimpleChange,
    SimpleChanges,
} from '@angular/core';
import { inject } from '@angular/core/testing';
import {
    ControlValueAccessor,
    UntypedFormControl,
    NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {
    MatDialog,
    MatDialogRef,
    MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { ActionDescriptor } from '@upupa/common';
import {
    DataComponentBase,
    DataTableModule,
    ValueDataComponentBase,
} from '@upupa/table';
import { ClientDataSource, DataAdapter } from '@upupa/data';
import { DynamicFormModule, Field, FormScheme } from '@upupa/dynamic-form';
import { languageDir, LanguageService } from '@upupa/language';
import { firstValueFrom } from 'rxjs';
import { ConfirmService, DialogService } from '@upupa/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { InputDefaults } from '@upupa/dynamic-form-native-theme';

@Component({
    selector: 'inline-editable-list',
    standalone: true,
    imports: [DataTableModule, MatFormFieldModule],
    templateUrl: './inline-editable-list.component.html',
    styleUrls: ['./inline-editable-list.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InlineEditableListComponent),
            multi: true,
        },
    ],
})
export class InlineEditableListComponent
    extends ValueDataComponentBase<any>
    implements OnInit, OnChanges, ControlValueAccessor
{
    appearance = input(InputDefaults.appearance);
    placeholder = input('');
    fields = input<Field[]>([]);
    label = input('');
    hint = input('');
    readonly = input(false);

    focusedTableItem: any;
    tableActions = input<ActionDescriptor[]>([
        { name: 'edit', icon: 'edit', text: 'Edit', menu: true },
        { name: 'delete', icon: 'delete_outline', text: 'Delete', menu: true },
        { name: 'create', icon: 'add_circle_outline', text: 'Create' },
    ]);

    tableColumns = input({});
    override adapter = model<DataAdapter<any>>(null);

    constructor(
        protected breakpointObserver: BreakpointObserver,
        public confirm: ConfirmService,
        private lang: LanguageService,
        protected dialog: MatDialog,
        private dialogService: DialogService
    ) {
        super();
    }

    clientDataSource: ClientDataSource;
    override ngOnInit(): void {
        super.ngOnInit();
        this.clientDataSource = new ClientDataSource(<any>(this.value ?? []));
        this.adapter.set(new DataAdapter(this.clientDataSource));
        this.adapter().refresh();
    }

    async onTableAction(event) {
        let value = this.clientDataSource.all;

        if (event.action.name === 'edit') {
            const res = await firstValueFrom(
                this.dialogService
                    .open(InlineEditableListFormComponent, {
                        maxWidth: '650px',
                        direction: languageDir(this.lang.language),
                        data: { value: event.data[0], fields: this.fields },
                    })
                    .afterClosed()
            );

            if (res) value.splice(value.indexOf(event.data[0]), 1, res);
        }
        if (event.action.name === 'delete') {
            if (!(await this.confirm.openWarning())) return;
            value.splice(value.indexOf(event.data[0]), 1);
        } else if (event.action.name === 'add') {
            const res = await firstValueFrom(
                this.dialogService
                    .open(InlineEditableListFormComponent, {
                        maxWidth: '650px',
                        direction: languageDir(this.lang.language),
                        data: { value: {}, fields: this.fields },
                    })
                    .afterClosed()
            );

            if (Object.keys(res ?? {}).length > 0) {
                if (!value) value = [];
                value.push(res);
            }
        }

        this.value.set((value ?? []).slice());

        this.clientDataSource.all = this.value() as any[];
    }
}

@Component({
    selector: 'inline-editable-list-form',
    standalone: true,
    imports: [DynamicFormModule],
    templateUrl: './inline-editable-list-form.component.html',
    styles: [
        `
            :host {
                width: 100%;
                padding-top: 1rem;
            }
        `,
    ],
})
export class InlineEditableListFormComponent {
    value: any = {};
    fields: FormScheme;
    constructor(
        public dialogRef: MatDialogRef<InlineEditableListFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.value = data.value ?? {};
        this.fields = data.fields ?? [];
    }

    save(v): void {
        this.dialogRef.close(v);
    }
}
