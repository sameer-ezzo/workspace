import { DOCUMENT, isPlatformBrowser, isPlatformServer } from "@angular/common";
import { inject, Inject, Injectable, PLATFORM_ID } from "@angular/core";

export type Theme = {
    name: string;
    className: string[];
    colorScheme?: "light" | "dark";
    icon?: string;
};

@Injectable({
    providedIn: "root",
})
export class ThemeService {
    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    themes: Theme[] = [];
    selectedTheme: Theme;

    constructor(@Inject(DOCUMENT) private document: Document) {}

    init(themes: Theme[]) {
        this.themes = themes;
    }

    apply(themeName: string) {
        const theme = this.themes.find((theme) => theme.name === themeName);
        this.selectedTheme = theme;
        this.document.documentElement.classList.remove(...this.themes.flatMap((theme) => theme.className));
        this.document.documentElement.classList.add(...theme.className);

        if (this.isBrowser) {
            localStorage.setItem("theme", themeName);
        }
    }
}
