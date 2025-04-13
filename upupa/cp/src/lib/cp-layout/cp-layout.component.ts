import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, model, PLATFORM_ID, viewChild, ViewEncapsulation } from "@angular/core";
import { AuthService } from "@upupa/auth";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { MatDrawer, MatDrawerMode, MatSidenavModule } from "@angular/material/sidenav";
import { SideBarItem, SideBarViewModel } from "../side-bar-group-item";
import { CP_SIDE_BAR_ITEMS } from "../di.token";
import { MatExpansionModule, MatExpansionPanel } from "@angular/material/expansion";
import { MatToolbarModule } from "@angular/material/toolbar";
import { ToolbarUserMenuComponent } from "../tool-bar-user-menu/tool-bar-user-menu.component";
import { RouterModule } from "@angular/router";
import { CommonModule, isPlatformBrowser, isPlatformServer } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { AuthorizeModule, AuthzDirective } from "@upupa/authz";
import { MatButtonModule } from "@angular/material/button";
import { from, map, Observable, of } from "rxjs";
import { MatDivider } from "@angular/material/divider";
import { DynamicComponent, PortalComponent } from "@upupa/common";

function sideBarItemsTransform(items: SideBarViewModel | Promise<SideBarViewModel> | Observable<SideBarViewModel>) {
    if (!items) return of([]);
    if ("subscribe" in items) return items;
    if ("then" in items) return from(items);
    if (Array.isArray(items)) return of(items);
    return of([items]);
}
@Component({
    selector: "cp-layout",
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatToolbarModule,
        ToolbarUserMenuComponent,
        RouterModule,
        MatSidenavModule,
        AuthorizeModule,
        MatExpansionModule,
        MatDivider,
        PortalComponent,
        AuthzDirective,
    ],
    templateUrl: "./cp-layout.component.html",
    styleUrls: ["./cp-layout.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class CpLayoutComponent {
    loginUrl = input("/login");
    drawer = viewChild(MatDrawer);
    sidebar = input();
    cp_side_bar_items = inject(CP_SIDE_BAR_ITEMS);
    sideBarItems = computed(() => {
        const sidebar = this.sidebar();
        return sideBarItemsTransform(this.cp_side_bar_items).pipe(map((items) => items.concat(sidebar ?? [])));
    });

    topBarItems = input<DynamicComponent[]>();

    getId = (g, i) => "accordion_" + (g.name || i);
    hasActiveChild(el: MatExpansionPanel) {
        return el._body?.nativeElement.querySelector(".active") !== null;
    }

    logo = input<string | null>(null);

    userMenuCommands = input<SideBarItem[]>();
    sideBarMode = model<MatDrawerMode>("side");
    isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    _isSidebarOpened() {
        return this.isBrowser ? localStorage.getItem("isSidebarOpened") === "true" : true;
    }
    isSidebarOpened = input<boolean, boolean>(this._isSidebarOpened(), { transform: (v) => v ?? this._isSidebarOpened() });

    onSidebarOpened(open: boolean) {
        if (this.isBrowser) localStorage.setItem("isSidebarOpened", open.toString());
    }

    public breakPointObserver = inject(BreakpointObserver);
    public auth = inject(AuthService);
    private readonly el = inject(ElementRef);
    constructor() {
        effect(() => {
            const items = this.sideBarItems();
            setTimeout(() => {
                const cpItems = this.el.nativeElement.querySelectorAll(".cp-accordion");
                cpItems.forEach((accEl: HTMLElement) => {
                    const links = accEl.querySelectorAll(".cp-item-link");
                    const allHidden = Array.from(links).every((l: HTMLElement) => l.style.display === "none");
                    if (allHidden) {
                        accEl.style.display = "hidden";
                    }
                });
            }, 500);
        });
    }

    ngOnInit() {
        this.breakPointObserver.observe([Breakpoints.XSmall]).subscribe(() => {
            const xs = this.breakPointObserver.isMatched(Breakpoints.XSmall);
            this.sideBarMode.set(xs ? "over" : "side");
        });
    }
}
