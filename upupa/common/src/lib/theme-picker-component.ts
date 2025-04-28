import { Component, inject } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuTrigger, MatMenuItem } from "@angular/material/menu";
import { Theme, ThemeService } from "@upupa/common";

@Component({
    selector: "app-theme-picket",
    standalone: true,
    imports: [MatIcon, MatMenu, MatIconButton, MatMenuTrigger, MatMenuItem],
    template: `
        <button mat-icon-button style="display: flex;" [matMenuTriggerFor]="themeMenu">
            @let colorScheme = themeService.selectedTheme.colorScheme;
            @if (colorScheme) {
                <mat-icon>{{ colorScheme === "dark" ? "dark_mode" : "light_mode" }}</mat-icon>
            } @else {
                <mat-icon>routine</mat-icon>
            }
        </button>
        <mat-menu #themeMenu="matMenu">
            @for (theme of themes; track theme) {
                <button mat-menu-item (click)="changeTheme(theme)">
                    @if (theme.colorScheme) {
                        <mat-icon>{{ theme.colorScheme === "dark" ? "dark_mode" : "light_mode" }}</mat-icon>
                    } @else {
                        <mat-icon>routine</mat-icon>
                    }
                    <span>{{ theme.name }}</span>
                </button>
            }
        </mat-menu>
    `,
})
export class ThemePicketComponent {
    readonly themeService = inject(ThemeService);
    readonly themes = this.themeService.themes;

    changeTheme(theme: Theme) {
        this.themeService.apply(theme.name);
    }
}
