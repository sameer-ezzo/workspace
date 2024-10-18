import {
    ChangeDetectionStrategy,
    Component,
    effect,
    ElementRef,
    inject,
    input,
    Input,
    signal,
    viewChild,
    ViewEncapsulation,
} from '@angular/core';
import { LanguageService } from '@upupa/language';
import { AuthService } from '@upupa/auth';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDrawer, MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { SideBarItem, SideBarViewModel } from '../side-bar-group-item';
import { CP_SIDE_BAR_ITEMS } from '../di.token';
import {
    MatExpansionModule,
    MatExpansionPanel,
} from '@angular/material/expansion';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { ToolbarUserMenuComponent } from '../tool-bar-user-menu/tool-bar-user-menu.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthorizeModule } from '@upupa/authz';
import { MatButtonModule } from '@angular/material/button';
import { from, Observable, of } from 'rxjs';

function sideBarItemsTransform(
    items:
        | SideBarViewModel
        | Promise<SideBarViewModel>
        | Observable<SideBarViewModel>
) {
    if (Array.isArray(items)) return of(items);
    else if (items instanceof Promise) return from(items);
    return items;
}
@Component({
    selector: 'cp-layout',
    standalone: true,
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
    ],
    templateUrl: './cp-layout.component.html',
    styleUrls: ['./cp-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class CpLayoutComponent {
    drawer = viewChild(MatDrawer);
    sideBarItems = input<
        Observable<SideBarViewModel>,
        | SideBarViewModel
        | Promise<SideBarViewModel>
        | Observable<SideBarViewModel>
    >(sideBarItemsTransform(inject(CP_SIDE_BAR_ITEMS)), {
        transform: (items) => sideBarItemsTransform(items),
    });

    getId = (g, i) => 'accordion_' + (g.name || i);
    hasActiveChild(el: MatExpansionPanel) {
        return el._body?.nativeElement.querySelector('.active') !== null;
    }

    logo = input<string | null>(null);

    userMenuCommands = input<SideBarItem[]>();
    sideBarMode = input<MatDrawerMode>('side');
    isSidebarOpened = input<false>();

    public languageService = inject(LanguageService);
    public breakPointObserver = inject(BreakpointObserver);
    public auth = inject(AuthService);
    private readonly el = inject(ElementRef);
    constructor() {
        effect(() => {
            const items = this.sideBarItems();
            setTimeout(() => {
                const cpItems =
                    this.el.nativeElement.querySelectorAll('.cp-accordion');
                cpItems.forEach((accEl: HTMLElement) => {
                    const links = accEl.querySelectorAll('.cp-item-link');
                    const allHidden = Array.from(links).every(
                        (l: HTMLElement) => l.style.display === 'none'
                    );
                    accEl.style.display = allHidden === true ? 'none' : 'block';
                });
            }, 500);
        });
    }

    ngOnInit() {
        // this.breakPointObserver.observe([Breakpoints.XSmall]).subscribe(() => {
        //     const xs = this.breakPointObserver.isMatched(Breakpoints.XSmall);
        //     this.sideBarMode = xs ? 'over' : 'side';
        //     this.isSidebarOpened = !xs;
        // });
    }
}
