import {
    Component,
    input,
    inject,
    runInInjectionContext,
    Type,
    Injector,
} from '@angular/core';
import { ActionDescriptor, ActionEvent, DynamicComponent } from '@upupa/common';
import { DialogService } from '@upupa/dialog';
import { MatBtnComponent } from '@upupa/mat-btn';
import { DataTableComponent } from '@upupa/table';
import { firstValueFrom } from 'rxjs';
import { DataFormWithViewModelComponent } from './data-form-with-view-model/data-form-with-view-model.component';

export type Class<T = any> = new (...args: any[]) => T;

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
    private readonly injector = inject(Injector);
    async onClick(e: ActionEvent) {
        const vm = this.viewmodel();
        const ref = this.dialog.openDialog(DataFormWithViewModelComponent, {
            title: 'Create',
            inputs: { viewmodel: vm },
        });
        const result = await firstValueFrom(ref.afterClosed());
        this.table.adapter().refresh();
    }
}

function merge<T, X>(a: Partial<T>, b: Partial<T>): Partial<T & X> {
    return { ...a, ...b } as Partial<T & X>;
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

    return {
        component: CreateButtonComponent,
        inputs: {
            viewmodel: options.formViewmodel,
            descriptor: options.descriptor,
        },

        ...options,
    } as DynamicComponent;
}
