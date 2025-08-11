import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { inject, Inject, Injectable, PLATFORM_ID, DOCUMENT } from "@angular/core";
import { ReplaySubject } from "rxjs";

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
    private readonly document = inject(DOCUMENT);
    themes: Theme[] = [];
    selectedTheme: Theme;

    private _events$ = new ReplaySubject<{ event: string; theme: Theme }>(1);
    events = this._events$.asObservable();

    init(themes: Theme[], defaultTheme = themes[0]?.name) {
        if (!themes || themes.length === 0 || themes.some((theme) => !theme.name || !theme.className))
            throw new Error("Invalid themes provided. Each theme must have a name and className.");
        this.themes = themes;
        this._events$.next({ event: "init", theme: this.themes.find((theme) => theme.name === defaultTheme) });
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

        this._events$.next({ event: "applied", theme: this.selectedTheme });
    }
}
