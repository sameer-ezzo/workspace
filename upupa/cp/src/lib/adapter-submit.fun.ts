import { inject, Injector, runInInjectionContext } from "@angular/core";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { DataAdapter } from "@upupa/data";
import { SnackBarService, DialogRef, SnackbarConfig } from "@upupa/dialog";
import { FriendlyError, friendlyError } from "./friendly-error";

export function navigateTo(result: any, commands: any[], extras?: NavigationExtras) {
    const _router = inject(Router);
    const _route = inject(ActivatedRoute);
    _router.navigate(commands, { relativeTo: _route, ...extras });
}

export function openSnackSuccess(result: any, config?: Partial<SnackbarConfig>) {
    const _snackBar = inject(SnackBarService);
    _snackBar.openSuccess("Saved successfully", config);
}
export function openSnackFailed(
    error: FriendlyError<any>,
    config: Partial<SnackbarConfig> = { duration: 15000, politeness: "assertive", verticalPosition: "top", panelClass: ["error"] },
) {
    const _snackBar = inject(SnackBarService);
    _snackBar.openFailed(`Save failed ${error.message}`, error, { ...config, panelClass: ["error", error.status] });
    console.error("Save failed", error);
}

export async function adapterSubmit<T = unknown, R = T>(
    form: T,
    onSuccess: (result: R, ...args: unknown[]) => void = openSnackSuccess,
    onError: (result: FriendlyError<any>, ...args: unknown[]) => void = openSnackFailed,
): Promise<R> {
    const injector = inject(Injector);
    const _adapter = inject(DataAdapter, { optional: true });

    if (!_adapter) return this as R;

    try {
        const response = (await _adapter.put({ _id: form["_id"] }, form)) as { result: R };
        if (onSuccess) runInInjectionContext(injector, () => onSuccess(response.result));
        return response.result;
    } catch (error) {
        const e = friendlyError(error);
        if (!onError) throw e;
        runInInjectionContext(injector, () => onError(e));
        return null;
    }
}
