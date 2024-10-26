import { Component, input, inject, Type, Injector } from '@angular/core';
import { ActionDescriptor, ActionEvent, DynamicComponent } from '@upupa/common';
import { DialogService, DialogServiceConfig } from '@upupa/dialog';
import { MatBtnComponent } from '@upupa/mat-btn';
import { DataTableComponent } from '@upupa/table';
import { firstValueFrom } from 'rxjs';
import { DataFormWithViewModelComponent } from './data-form-with-view-model/data-form-with-view-model.component';
import { DataService, NormalizedItem } from '@upupa/data';

export type Class<T = any> = new (...args: any[]) => T;
function merge<T, X>(a: Partial<T>, b: Partial<T>): Partial<T & X> {
    return { ...a, ...b } as Partial<T & X>;
}

@Component({
    selector: 'create-button',
    imports: [MatBtnComponent],
    standalone: true,
    template: `
        <mat-btn
            [descriptor]="descriptor()"
            (onClick)="onClick($event)"
        ></mat-btn>
    `,
    styles: [],
})
export class CreateButtonComponent {
    viewmodel = input.required<Class>();
    descriptor = input.required<ActionDescriptor>();
    options = input.required<any>();
    dialog = inject(DialogService);
    private readonly table = inject(DataTableComponent);
    async onClick(e: ActionEvent) {
        const vm = this.viewmodel();
        console.log('CreateButtonComponent', vm);

        const ref = this.dialog.openDialog(DataFormWithViewModelComponent, {
            title: 'Create',
            inputs: { viewmodel: vm },
        });
        const result = await firstValueFrom(ref.afterClosed());
        this.table.adapter().refresh();
    }
}

@Component({
    selector: 'edit-button',
    imports: [MatBtnComponent],
    standalone: true,
    template: `
        <mat-btn
            [descriptor]="descriptor()"
            (onClick)="onClick($event)"
        ></mat-btn>
    `,
    styles: [],
})
export class EditButtonComponent<T = any> {
    dialogOptions = input<Partial<DialogServiceConfig>>({
        title: 'Edit',
        canEscape: false,
    });

    viewmodel = input.required<Class>();
    descriptor = input.required<ActionDescriptor, any>({
        transform: (d: any) => {
            return d.value ?? d;
        },
    });
    options = input.required<any>();
    dialog = inject(DialogService);
    path = input<(item) => string>();
    element = input<NormalizedItem<T>>(null);

    private readonly table = inject(DataTableComponent);
    private readonly injector = inject(Injector);
    async onClick(e: ActionEvent) {
        const vm = this.viewmodel();
        const element = this.element();
        let value = element.item;
        const path = this.path();
        if (path) {
            const ds = this.injector.get(DataService);
            const resolvedPath =
                typeof path === 'function' ? path(value) : path;
            value = await firstValueFrom(ds.get(resolvedPath)).then(
                (r) => r.data?.[0]
            );
        }

        const ref = this.dialog.openDialog(DataFormWithViewModelComponent, {
            ...this.dialogOptions(),
            inputs: {
                ...this.dialogOptions().inputs,
                viewmodel: this.viewmodel(),
                value,
            },
        });
        const result = await firstValueFrom(ref.afterClosed());
        this.table.adapter().refresh();
    }
}

export function createButton(options: {
    descriptor?: Partial<ActionDescriptor>;
    formViewmodel: Class;
}): Type<any> | DynamicComponent {
    if (!options || !options.formViewmodel)
        throw new Error('formViewmodel is required');
    const defaultCreateDescriptor: Partial<ActionDescriptor> = {
        text: 'Create',
        icon: 'add',
        color: 'primary',
        variant: 'raised',
    };
    options.descriptor = merge(
        defaultCreateDescriptor,
        options.descriptor || {}
    );

    const template = {
        ...options,
        component: CreateButtonComponent,
        inputs: {
            viewmodel: options.formViewmodel,
            descriptor: options.descriptor,
        },
    } as DynamicComponent;
    return template;
}

export function editButton(options: {
    descriptor?: Partial<ActionDescriptor>;
    formViewmodel: Class;
    path?: (item) => string;
}): DynamicComponent {
    if (!options || !options.formViewmodel)
        throw new Error('formViewmodel is required');
    const defaultEditDescriptor: Partial<ActionDescriptor> = {
        text: 'Edit',
        icon: 'edit',
        variant: 'icon',
        color: 'accent',
    };
    options.descriptor = merge(defaultEditDescriptor, options.descriptor || {});
    const template = {
        inputs: {
            viewmodel: options.formViewmodel,
            descriptor: options.descriptor,
            path: options.path,
        },
        component: EditButtonComponent,
    } as DynamicComponent;
    return template;
}
