import { provideAppInitializer, inject } from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";

export function provideMaterialSymbols() {
    return provideAppInitializer(() => {
        const iconRegistry = inject(MatIconRegistry);
        iconRegistry.setDefaultFontSetClass("material-symbols-outlined");
    });
}
