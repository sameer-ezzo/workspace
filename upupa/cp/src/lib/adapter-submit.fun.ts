import { inject, Injector, runInInjectionContext } from "@angular/core";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { DataAdapter } from "@upupa/data";
import { SnackBarService, DialogRef, SnackbarConfig } from "@upupa/dialog";
import { FriendlyError, friendlyError } from "./friendly-error";
import { SubmitResult } from "./data-form-with-view-model/viewmodels/form.viewmodel";

export function navigateTo(commands: string[], extras?: NavigationExtras) {
    const _router = inject(Router);
    const _route = inject(ActivatedRoute);
    _router.navigate(commands, { relativeTo: _route, ...extras });
}

export function closeDialogOrNavigateTo(dialogResult: SubmitResult<any>, commands: string[], extras?: NavigationExtras) {
    const dialogRef = inject(DialogRef);
    if (dialogRef) dialogRef.close(dialogResult);
    else navigateTo(commands, extras);
}

export function closeDialog(dialogResult: SubmitResult<any>) {
    const dialogRef = inject(DialogRef);
    if (dialogRef) dialogRef.close(dialogResult);
}

export function openSnackSuccess(result: any, config?: Partial<SnackbarConfig>) {
    const _snackBar = inject(SnackBarService);
    _snackBar.openSuccess("Saved successfully", config);
    return result;
}
export function openSnackFailed(
    error: FriendlyError<any>,
    config: Partial<SnackbarConfig> = { duration: 15000, politeness: "assertive", verticalPosition: "top", panelClass: ["error"] },
) {
    const _snackBar = inject(SnackBarService);
    _snackBar.openFailed(`Failed! ${error.message}`, error, { ...config, panelClass: ["error", error.status] });
    console.error("Failed!", error);
}

type OnSuccess = (result: any) => any;
type OnError = (error: FriendlyError<any>) => any;

export async function adapterSubmit<T = any>(
    form: T,
    onSuccess: OnSuccess = (result) => {
        openSnackSuccess(result);
        closeDialog(result);
    },
    onError: OnError = openSnackFailed,
): Promise<T> {
    const injector = inject(Injector);
    const _adapter = inject(DataAdapter, { optional: true });

    try {
        if (!_adapter) throw new Error("DataAdapter is not provided");
        const response = await _adapter.put({ _id: form["_id"] }, form);
        const result = "document" in response ? response.document : response;
        return onSuccess ? runInInjectionContext(injector, () => onSuccess(result)) : result;
    } catch (error) {
        const err = friendlyError(error);
        if (!onError) throw err;

        const handledError = await runInInjectionContext(injector, () => onError(err));
        throw handledError ?? err;
    }
}
