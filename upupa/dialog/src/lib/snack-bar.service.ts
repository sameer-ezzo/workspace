import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";

export type SnackbarConfig = { callbackName?: string; callback?: () => void } & MatSnackBarConfig<any>;
@Injectable({ providedIn: "root" })
export class SnackBarService {
    constructor(private snack: MatSnackBar) {}
    openSuccess(message: string = "success", config?: SnackbarConfig) {
        if (config && config.callback) {
            return this.openAction(message, config.callbackName ?? "undo", () => config.callback(), config);
        } else return this.snack.open(message, null, { duration: 3000, verticalPosition: "top" });
    }
    openFailed(message: string = "failed", error?: any, config?: SnackbarConfig) {
        if (config && config.callback) {
            return this.openAction(
                message,
                config.callbackName ?? "snkbar-failed-msg",
                () => {
                    config.callback();
                },
                config,
            );
        } else return this.snack.open(message, null, { duration: 5000, politeness: "assertive", verticalPosition: "top", panelClass: ["error"] });
    }
    openWarning(message: string = "warning", error: any = null) {
        return this.snack.open(message, null, { duration: 5000, politeness: "assertive", verticalPosition: "top", panelClass: ["warning"] });
    }
    openInfo(message: string) {
        return this.snack.open(message, null, { duration: 3000, verticalPosition: "top" });
    }
    openConfirm(message: string, onConfirmed: () => void) {
        return this.openAction(message, "yes", () => {
            onConfirmed();
        });
    }

    openAction(message: string, actionLabel: string, action: () => void, options?: MatSnackBarConfig<any>) {
        const bar = this.snack.open(message, actionLabel, { duration: 3000, verticalPosition: "top", ...options });
        const sub1 = bar.onAction().subscribe(() => action());
        const sub2 = bar.afterDismissed().subscribe(() => {
            sub1.unsubscribe();
            sub2.unsubscribe();
        });
        return bar;
    }
}
