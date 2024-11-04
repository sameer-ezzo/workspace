import { inject } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { Patch } from '@noah-ark/json-patch';
import { DataService } from '@upupa/data';
import { SnackBarService, UpupaDialogComponent } from '@upupa/dialog';
import { ExtendedValueChangeEvent } from '@upupa/dynamic-form';
import { DataFormWithViewModelComponent } from '../data-form-with-view-model.component';

export async function apiPost(ds: DataService, path: string, value: any) {
    if (!path) throw new Error(`Path is required for submitting data form`);
    return await ds.post(path, value);
}
export async function apiPut(ds: DataService, path: string, value: any) {
    if (!path) throw new Error(`Path is required for submitting data form`);
    return await ds.put(path, value);
}

export async function apiSubmit<TSelf>(self: TSelf, collection: string, patch = false) {
    const ds = inject(DataService);
    const dialogContainer = inject(UpupaDialogComponent, { optional: true });
    const snack = inject(SnackBarService, { optional: true });
    const form = inject(DataFormWithViewModelComponent);
    const patches = patch ? form.dynamicFormEl().patches : undefined;

    const id = self['_id'];
    let res: any = undefined;
    try {
        if (!id) res = await apiPost(ds, collection, self);
        else {
            if (patch === true && patches) {
                const patchesArr = Object.entries(patches ?? {}).map(([path, value]) => ({ op: 'replace', path, value }) as Patch);
                res = await ds.patch(`/blogs/${id}`, patchesArr);
            } else {
                res = await apiPut(ds, `${collection}/${id}`, self);
            }
        }
        await ds.refreshCache('blogs');
        dialogContainer?.dialogRef?.close(res);
        return res;
    } catch (err: any) {
        const error = err['error'] ?? err;
        console.error(error);
        snack.openFailed(error.message ?? 'Failed to submit data form');
        throw error;
    }
}

export interface OnSubmit {
    onSubmit(): Promise<void> | void;
}
export interface OnValidate {
    validate?: () => Promise<Promise<ValidationErrors>>;
}
export interface OnAfterSubmit {
    afterSubmit?: () => Promise<void> | void;
}
export interface OnValueChange {
    onValueChange(e: ExtendedValueChangeEvent);
}

export interface DataFormViewModel extends OnSubmit, OnValidate, OnAfterSubmit {}
