import { Injectable } from "@angular/core";
import { MatSnackBar, MatSnackBarConfig } from "@angular/material/snack-bar";

export type SnackbarConfig = { callbackName?: string; callback?: () => void } & MatSnackBarConfig<any>;
@Injectable({ providedIn: "root" })
export class SnackBarService {
    constructor(private snack: MatSnackBar) {}
    openSuccess(message: string = "success", config?: SnackbarConfig) {
        const defaultConfig: MatSnackBarConfig = {
            duration: 3000,
            verticalPosition: "top"
        };

        if (config?.callback) {
            return this.openAction(message, config.callbackName ?? "undo", () => config.callback(), {
                ...defaultConfig,
                ...config
            });
        }
        return this.snack.open(message, null, { ...defaultConfig, ...config });
    }
    openFailed(message: string = "failed", error?: any, config?: SnackbarConfig) {
        const defaultConfig: MatSnackBarConfig = {
            duration: 5000,
            politeness: "assertive",
            verticalPosition: "top",
            panelClass: ["error"]
        };

        if (config?.callback) {
            return this.openAction(message, config.callbackName ?? "snkbar-failed-msg", () => config.callback(), {
                ...defaultConfig,
                ...config
            });
        }
        return this.snack.open(message, null, { ...defaultConfig, ...config });
    }
    openWarning(message: string = "warning", error: any = null, config?: MatSnackBarConfig) {
        const defaultConfig: MatSnackBarConfig = {
            duration: 5000,
            politeness: "assertive",
            verticalPosition: "top",
            panelClass: ["warning"]
        };
        return this.snack.open(message, null, { ...defaultConfig, ...config });
    }
    openInfo(message: string, config?: MatSnackBarConfig) {
        const defaultConfig: MatSnackBarConfig = {
            duration: 3000,
            verticalPosition: "top"
        };
        return this.snack.open(message, null, { ...defaultConfig, ...config });
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
