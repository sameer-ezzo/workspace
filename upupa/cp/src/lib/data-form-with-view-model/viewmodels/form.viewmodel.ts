import { inject } from "@angular/core";
import { ValidationErrors } from "@angular/forms";
import { Patch } from "@noah-ark/json-patch";
import { DataService } from "@upupa/data";
import { SnackBarService, DialogWrapperComponent } from "@upupa/dialog";
import { ExtendedValueChangeEvent } from "@upupa/dynamic-form";
import { DataFormWithViewModelComponent } from "../data-form-with-view-model.component";

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
    const dialogContainer = inject(DialogWrapperComponent, { optional: true });
    const snack = inject(SnackBarService, { optional: true });
    const form = inject(DataFormWithViewModelComponent);
    const patches = patch ? form.dynamicFormEl().patches : undefined;

    const id = self["_id"];
    let res: any = undefined;
    try {
        if (!id) {
            const { result } = await apiPost(ds, collection, self);
            return result;
        } else {
            if (patch === true && patches.length > 0) {
                res = await ds.patch(`/${collection}/${id}`, patches as Patch[]);
            } else {
                res = await apiPut(ds, `${collection}/${id}`, self);
            }
        }
        await ds.refreshCache("blogs");
        dialogContainer?.dialogRef?.close(res);
        return res;
    } catch (err: any) {
        const error = err["error"] ?? err;
        console.error(error);
        snack.openFailed(error.message ?? "Failed to submit data form");
        throw error;
    }
}

export interface OnSubmit<SubmitResult = unknown> {
    onSubmit(): Promise<SubmitResult> | SubmitResult;
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
