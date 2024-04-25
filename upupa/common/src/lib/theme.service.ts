import { DOCUMENT, isPlatformBrowser, isPlatformServer } from "@angular/common";
import { Inject, Injectable, PLATFORM_ID } from "@angular/core";

export const THEMES = ['light-theme', 'dark-theme'];
export type Theme = typeof THEMES[number];



@Injectable({
    providedIn: 'root'
})
export class ThemeService {

    isBrowser!: boolean;
    isServer!: boolean;

    defaultTheme: Theme = 'light-theme';
    theme: Theme;

    constructor(@Inject(DOCUMENT) private document: Document,
        @Inject(PLATFORM_ID) platformId: any) {
        this.isBrowser = isPlatformBrowser(platformId);
        this.isServer = isPlatformServer(platformId);
    }

    init(applySystemTheme = true, defaultTheme: Theme = 'light-theme') {
        this.defaultTheme = defaultTheme ?? 'light-theme';
        let currentPreference = this.isBrowser ? localStorage?.getItem('theme') as Theme | null : defaultTheme;

        if (this.isBrowser && window) {
            const mediaPrefersDark = window.matchMedia('(prefers-color-scheme: dark)')

            currentPreference ??= applySystemTheme ? mediaPrefersDark.matches ? 'dark-theme' : 'light-theme' : defaultTheme;
            this.apply(currentPreference);

            mediaPrefersDark.addEventListener('change', e => {
                const newColorScheme = e.matches ? 'dark-theme' : 'light-theme';
                if (applySystemTheme) this.apply(newColorScheme);
            })
        }

        this.apply(currentPreference ?? defaultTheme);
    }

    applySystemTheme() {
        if (this.isBrowser && window) {
            const mediaPrefersDark = window.matchMedia('(prefers-color-scheme: dark)')
            const newColorScheme = mediaPrefersDark.matches ? 'dark-theme' : 'light-theme';
            this.apply(newColorScheme);
        }
    }

    apply(theme: Theme) {
        this.theme = theme;
        this.document.body.classList.remove(...THEMES);
        this.document.body.classList.add(theme);
    }

    toggle() {
        const theme_index = THEMES.indexOf(this.theme);
        const theme = THEMES[(theme_index + 1) % THEMES.length];
        this.apply(theme);

        if (this.isBrowser) localStorage?.setItem('theme', this.theme);
    }

}
