import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, ElementRef, forwardRef, Inject, Input, OnChanges, OnInit, SimpleChange, SimpleChanges } from '@angular/core';
import { inject } from '@angular/core/testing';
import { ControlValueAccessor, UntypedFormControl, NG_VALUE_ACCESSOR, NG_VALIDATORS } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActionDescriptor, ConfirmService, } from '@upupa/common';
import { DataComponentBase } from '@upupa/table';
import { ClientDataSource, DataAdapter } from '@upupa/data'
import { Field, FormScheme } from '@upupa/dynamic-form';
import { languageDir, LanguageService } from '@upupa/language';
import { DialogService } from '@upupa/common';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'inline-editable-list',
    templateUrl: './inline-editable-list.component.html',
    styleUrls: ['./inline-editable-list.component.scss'],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InlineEditableListComponent), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => InlineEditableListComponent), multi: true }

    ]
})
export class InlineEditableListComponent extends DataComponentBase<any> implements OnInit, OnChanges, ControlValueAccessor {
    @Input() appearance = 'legacy';
    @Input() placeholder: string;

    @Input() fields: Field[] = [];

    @Input() label: string;
    @Input() hint: string;
    @Input() readonly = false;


    @Input() required: boolean;

    focusedTableItem: any;
    @Input() tableActions: ActionDescriptor[] = [
        { action: 'edit', icon: 'edit', text: 'Edit', menu: true },
        { action: 'delete', icon: 'delete_outline', text: 'Delete', menu: true },
        { action: 'create', icon: 'add_circle_outline', text: 'Create' }
    ];

    @Input() tableColumns = {};

    constructor(protected breakpointObserver: BreakpointObserver,
        public confirm: ConfirmService,
        private lang: LanguageService,
        protected dialog: MatDialog, private dialogService: DialogService) {
        super();
    }

    clientDataSource: ClientDataSource;
    override ngOnInit(): void {
        super.ngOnInit();
        this.clientDataSource = new ClientDataSource(<any>(this.value ?? []));
        this.adapter = new DataAdapter(this.clientDataSource)
        this.adapter.refresh()
    }

    async onTableAction(event) {
        let value = this.clientDataSource.all;

        if (event.action.name === 'edit') {
            const res = await firstValueFrom(this.dialogService.open(InlineEditableListFormComponent, {
                maxWidth: '650px', direction: languageDir(this.lang.language),
                data: { value: event.data[0], fields: this.fields }
            }).afterClosed());

            if (res) value.splice(value.indexOf(event.data[0]), 1, res);

        }
        if (event.action.name === 'delete') {
            if (!await this.confirm.openWarning()) return;
            value.splice(value.indexOf(event.data[0]), 1);
        }
        else if (event.action.name === 'add') {
            const res = await firstValueFrom(this.dialogService.open(InlineEditableListFormComponent, {
                maxWidth: '650px', direction: languageDir(this.lang.language),
                data: { value: {}, fields: this.fields }
            }).afterClosed());


            if (Object.keys(res ?? {}).length > 0) {
                if (!value) value = [];
                value.push(res);
            }
        }

        this.value = (value ?? []).slice();
        this.control.setValue(this.value);
        this.clientDataSource.all = this.value as any[];

    }

}




@Component({
    selector: 'inline-editable-list-form',
    templateUrl: './inline-editable-list-form.component.html',
    styles: [`
  :host{
    width: 100%;
    padding-top: 1rem
  }
  `],
})
export class InlineEditableListFormComponent {
    value: any = {};
    fields: FormScheme;
    constructor(public dialogRef: MatDialogRef<InlineEditableListFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.value = data.value ?? {};
        this.fields = data.fields ?? [];
    }

    save(v): void {
        this.dialogRef.close(v);
    }

}