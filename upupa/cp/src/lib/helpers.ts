import { Component, input, inject, Type, Injector, SimpleChanges, signal } from '@angular/core';
import { ActionDescriptor, ActionEvent, DynamicComponent } from '@upupa/common';
import { ConfirmOptions, ConfirmService, DialogService, DialogServiceConfig } from '@upupa/dialog';
import { MatBtnComponent } from '@upupa/mat-btn';
import { DataTableComponent } from '@upupa/table';
import { firstValueFrom } from 'rxjs';
import { DataFormWithViewModelComponent } from './data-form-with-view-model/data-form-with-view-model.component';
import { DataService, NormalizedItem } from '@upupa/data';
import { Class, delay } from '@noah-ark/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

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
    selector: 'delete-button',
    imports: [MatBtnComponent, MatProgressSpinnerModule, MatIconModule],
    standalone: true,
    template: `
        <mat-btn [descriptor]="buttonDescriptor()" (onClick)="onClick($event)">
            @if (deleting()) {
                <mat-spinner class="spinner" mode="indeterminate" [diameter]="20" [color]="buttonDescriptor().color"></mat-spinner>
            }
        </mat-btn>
    `,
    styles: [],
})
export class DeleteButtonComponent<T = any> {
    deleting = signal(false);
    buttonDescriptor = input.required<ActionDescriptor>();
    options = input.required<(selected: any) => { path: string } & ConfirmOptions, (selected: any) => { path: string } & Partial<ConfirmOptions>>({
        transform: (fn) => {
            return (selected: any) => ({
                title: 'Delete',
                confirmText: 'Are you sure you want to delete this item?',
                no: 'Keep it',
                yes: 'Delete',
                path: '',
                ...fn(selected),
            });
        },
    });
    element = input<NormalizedItem<T>>(null);

    private readonly confirm = inject(ConfirmService);
    private readonly table = inject(DataTableComponent);
    private readonly injector = inject(Injector);
    async onClick(e: ActionEvent) {
        const options = this.options()(this.element().item);

        const confirmed = await this.confirm.openWarning(options);

        if (!confirmed) return;
        this.deleting.set(true);

        const ds = this.injector.get(DataService);
        const path = options.path;
        if (!path || path.trim().length === 0) throw new Error('Path is required');

        try {
            await ds.delete(path);
            await ds.refreshCache(path);
            this.table.adapter().refresh();
            await delay(10000);
        } catch (e) {
            console.error(e);
        } finally {
            this.deleting.set(false);
        }
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

export function deleteButton(options: { descriptor?: Partial<ActionDescriptor>; optionsFactory: (selected: any) => { path: string } & Partial<ConfirmOptions> }): DynamicComponent {
    if (!options || !options.optionsFactory) throw new Error('optionsFactory is required');
    const defaultDeleteDescriptor: Partial<ActionDescriptor> = {
        text: 'Delete',
        icon: 'delete',
        variant: 'icon',
        color: 'warn',
    };
    options.descriptor = merge(defaultDeleteDescriptor, options.descriptor || {});

    const template = {
        inputs: {
            buttonDescriptor: options.descriptor,
            options: options.optionsFactory,
        },
        component: DeleteButtonComponent,
    } as DynamicComponent;

    return template;
}
