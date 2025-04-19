import { DOCUMENT, isPlatformBrowser, isPlatformServer } from "@angular/common";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";

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
    isBrowser!: boolean;
    isServer!: boolean;
    themes: Theme[] = [];
    selectedTheme: Theme;

    constructor(
        @Inject(DOCUMENT) private document: Document,
        @Inject(PLATFORM_ID) platformId: any,
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.isServer = isPlatformServer(platformId);
    }

    init(themes: Theme[], autoApplySystemTheme: boolean = true) {
        this.themes = themes;
        const themesHasLight = themes.some((theme) => theme.colorScheme === "light");
        const themesHasDark = themes.some((theme) => theme.colorScheme === "dark");

        if (this.isBrowser && themesHasLight && themesHasDark) {
            const mediaPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");

            if (autoApplySystemTheme) {
                mediaPrefersDark.addEventListener("change", (e) => {
                    const theme = this.findDefaultTheme();
                    this.apply(theme.name);
                });
            }
            const theme = this.findDefaultTheme();
            this.apply(theme.name);
        }
    }

    findDefaultTheme() {
        const mediaPrefersDark = window.matchMedia("(prefers-color-scheme: dark)");
        const currentPreference = mediaPrefersDark.matches ? "dark" : "light";
        const lastTheme = localStorage.getItem("theme");
        let currentTheme = this.themes.find((theme) => theme.name === lastTheme);
        currentTheme ??= this.themes.find((theme) => theme.colorScheme === currentPreference) ?? this.themes[0];
        return currentTheme;
    }

    apply(themeName: string) {
        const theme = this.themes.find((theme) => theme.name === themeName);
        this.selectedTheme = theme;
        this.document.documentElement.classList.remove(...this.themes.flatMap((theme) => theme.className));
        this.document.documentElement.classList.add(...theme.className);
        localStorage.setItem("theme", themeName);
    }
}
