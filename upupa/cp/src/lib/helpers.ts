import { Component, input, inject, Type, Injector, SimpleChanges } from '@angular/core';
import { ActionDescriptor, ActionEvent, DynamicComponent } from '@upupa/common';
import { DialogService, DialogServiceConfig } from '@upupa/dialog';
import { MatBtnComponent } from '@upupa/mat-btn';
import { DataTableComponent } from '@upupa/table';
import { firstValueFrom } from 'rxjs';
import { DataFormWithViewModelComponent } from './data-form-with-view-model/data-form-with-view-model.component';
import { DataService, NormalizedItem } from '@upupa/data';
import { Class } from '@noah-ark/common';


function merge<T, X>(a: Partial<T>, b: Partial<T>): Partial<T & X> {
    return { ...a, ...b } as Partial<T & X>;
}

@Component({
    selector: 'create-button',
    imports: [MatBtnComponent],
    standalone: true,
    template: ` <mat-btn [descriptor]="buttonDescriptor()" (onClick)="onClick($event)"></mat-btn> `,
    styles: [],
})
export class CreateButtonComponent {
    viewModel = input.required<Class>();
    buttonDescriptor = input.required<ActionDescriptor>();
    options = input.required<any>();
    dialog = inject(DialogService);
    private readonly table = inject(DataTableComponent);
    async onClick(e: ActionEvent) {
        const vm = this.viewModel();

        const ref = this.dialog.openDialog(DataFormWithViewModelComponent, {
            title: 'Create',
            inputs: { viewModel: vm },
        });
        const result = await firstValueFrom(ref.afterClosed());
        this.table.adapter().refresh();
    }
}

@Component({
    selector: 'edit-button',
    imports: [MatBtnComponent],
    standalone: true,
    template: ` <mat-btn [descriptor]="buttonDescriptor()" (onClick)="onClick($event)"></mat-btn> `,
    styles: [],
})
export class EditButtonComponent<T = any> {
    dialogOptions = input<Partial<DialogServiceConfig>>({
        title: 'Edit',
        canEscape: false,
    });

    viewModel = input.required<Class>();
    buttonDescriptor = input.required<ActionDescriptor>();
    options = input.required<any>();
    dialog = inject(DialogService);
    path = input<(item) => string>();
    element = input<NormalizedItem<T>>(null);

    private readonly table = inject(DataTableComponent);
    private readonly injector = inject(Injector);
    async onClick(e: ActionEvent) {
        const viewModel = this.viewModel();
        const element = this.element();
        let value = element.item;
        const path = this.path();
        if (path) {
            const ds = this.injector.get(DataService);
            const resolvedPath = typeof path === 'function' ? path(value) : path;
            value = await firstValueFrom(ds.get(resolvedPath)).then((r) => r.data?.[0]);
        }

        const ref = this.dialog.openDialog(DataFormWithViewModelComponent, {
            ...this.dialogOptions(),
            inputs: {
                ...this.dialogOptions().inputs,
                viewModel: viewModel,
                value: value,
            },
        });
        const result = await firstValueFrom(ref.afterClosed());
        this.table.adapter().refresh();
    }
}

export function createButton(options: { descriptor?: Partial<ActionDescriptor>; formViewModel: Class }): Type<any> | DynamicComponent {
    if (!options || !options.formViewModel) throw new Error('formViewModel is required');
    const defaultCreateDescriptor: Partial<ActionDescriptor> = {
        text: 'Create',
        icon: 'add',
        color: 'primary',
        variant: 'raised',
    };
    options.descriptor = merge(defaultCreateDescriptor, options.descriptor || {});

    const template = {
        ...options,
        component: CreateButtonComponent,
        inputs: {
            viewModel: options.formViewModel,
            buttonDescriptor: options.descriptor,
        },
    } as DynamicComponent;
    return template;
}

export function editButton(options: { descriptor?: Partial<ActionDescriptor>; formViewModel: Class; path?: (item) => string }): DynamicComponent {
    if (!options || !options.formViewModel) throw new Error('formViewModel is required');
    const defaultEditDescriptor: Partial<ActionDescriptor> = {
        text: 'Edit',
        icon: 'edit',
        variant: 'icon',
        color: 'accent',
    };
    options.descriptor = merge(defaultEditDescriptor, options.descriptor || {});

    const template = {
        inputs: {
            viewModel: options.formViewModel,
            buttonDescriptor: options.descriptor,
            path: options.path,
        },
        component: EditButtonComponent,
    } as DynamicComponent;

    return template;
}
