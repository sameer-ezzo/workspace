import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, Input, signal, ViewEncapsulation } from "@angular/core";
import { LanguageService } from "@upupa/language";
import { AuthService } from "@upupa/auth";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { MatDrawerMode, MatSidenavModule } from "@angular/material/sidenav";
import { InlineEditableListComponent } from "../inline-editable-list/inline-editable-list.component";
import { SideBarGroup, SideBarItem } from "../side-bar-group-item";
import { DynamicFormService } from "@upupa/dynamic-form";
import { DEFAULT_THEME_NAME } from "@upupa/dynamic-form";
import { CP_SIDE_BAR_ITEMS } from "../di.token";
import { MatExpansionModule, MatExpansionPanel } from "@angular/material/expansion";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatMenuModule } from "@angular/material/menu";
import { ToolbarUserMenuComponent } from "../tool-bar-user-menu/tool-bar-user-menu.component";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { AuthorizeModule } from "@upupa/authz";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: "cp-layout",
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatToolbarModule, ToolbarUserMenuComponent, RouterModule, MatSidenavModule, AuthorizeModule, MatExpansionModule],
    templateUrl: "./cp-layout.component.html",
    styleUrls: ["./cp-layout.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class CpLayoutComponent {
    sideBarItems = signal([]);

    getId = (g, i) => "accordion_" + (g.name || i);
    hasActiveChild(el: MatExpansionPanel) {
        return el._body?.nativeElement.querySelector(".active") !== null;
    }

    @Input() logo: string | null = null;

    private _sideBarCommands = [] as SideBarGroup[];
    @Input()
    public get sideBarCommands() {
        return this._sideBarCommands;
    }
    public set sideBarCommands(value) {
        if (!value) return;
        this._sideBarCommands = value;
        this.sideBarItems.set(value);
    }
    @Input() userMenuCommands: SideBarItem[];
    @Input() sideBarMode: MatDrawerMode = "side";
    @Input() isSidebarOpened = false;

    private theme = inject(DEFAULT_THEME_NAME);
    private dfForm = inject(DynamicFormService);
    public languageService = inject(LanguageService);
    public breakPointObserver = inject(BreakpointObserver);
    public auth = inject(AuthService);
    private readonly el = inject(ElementRef);
    constructor() {
        const t = inject(CP_SIDE_BAR_ITEMS) ?? this.sideBarCommands ?? [];

        if (Array.isArray(t)) this.sideBarItems.set(t);
        else if (t instanceof Promise) t.then(this.sideBarItems.set);
        else t.subscribe((r) => this.sideBarItems.set(r));

        effect(() => {
            const items = this.sideBarItems();
            setTimeout(() => {
                const cpItems = this.el.nativeElement.querySelectorAll(".cp-accordion");
                cpItems.forEach((accEl: HTMLElement) => {
                    const links = accEl.querySelectorAll(".cp-item-link");
                    const allHidden = Array.from(links).every((l: HTMLElement) => l.style.display === "none");
                    accEl.style.display = allHidden === true ? "none" : "block";
                });
            }, 500);
        });
    }

    ngOnInit() {
        this.dfForm.addControlType("inline-editable-list", InlineEditableListComponent, this.theme);
        this.breakPointObserver.observe([Breakpoints.XSmall]).subscribe(() => {
            const xs = this.breakPointObserver.isMatched(Breakpoints.XSmall);
            this.sideBarMode = xs ? "over" : "side";
            this.isSidebarOpened = !xs;
        });
    }
}
