import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { inject, Inject, Injectable, PLATFORM_ID, DOCUMENT } from "@angular/core";

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

    init(themes: Theme[], defaultTheme = themes[0]?.name) {
        if (!themes || themes.length === 0 || themes.some((theme) => !theme.name || !theme.className))
            throw new Error("Invalid themes provided. Each theme must have a name and className.");
        this.themes = themes;
        this.apply(defaultTheme);
    }

    apply(themeName: string) {
        const theme = this.themes.find((theme) => theme.name === themeName);
        if (!theme) {
            console.error(`Theme "${themeName}" not found.`);
            return;
        }
        this.selectedTheme = theme;
        this.document.documentElement.classList.remove(...this.themes.flatMap((theme) => theme.className));
        this.document.documentElement.classList.add(...theme.className);

        if (this.isBrowser) {
            localStorage.setItem("theme", themeName);
        }
    }
}
