import { ChangeDetectionStrategy, Component, Inject, Input, ViewEncapsulation } from '@angular/core'
import { LanguageService } from '@upupa/language'
import { AuthService } from '@upupa/auth'
import { Subject } from 'rxjs'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { MatDrawerMode } from '@angular/material/sidenav'
import { InlineEditableListComponent } from '../inline-editable-list/inline-editable-list.component'
import { SideBarGroup, SideBarItem } from './side-bar-group-item'
import { DynamicFormService } from '@upupa/dynamic-form'
import { DEFAULT_THEME_NAME } from '@upupa/dynamic-form'
import { CP_OPTIONS } from '../di.token'

@Component({
    selector: 'cp-layout',
    templateUrl: './cp-layout.component.html',
    styleUrls: ['./cp-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class CpLayoutComponent {

    @Input() logo: string | null = null

    @Input() sideBarCommands: SideBarGroup[]
    @Input() userMenuCommands: SideBarItem[]
    @Input() sideBarMode: MatDrawerMode = 'side'
    @Input() isSidebarOpened = false

    destroyed$ = new Subject()
    constructor(public auth: AuthService,
        @Inject(CP_OPTIONS) private readonly cpOptions,
        @Inject(DEFAULT_THEME_NAME) private theme: string,
        private dfForm: DynamicFormService,
        public languageService: LanguageService,
        public breakPointObserver: BreakpointObserver) {


        dfForm.addControlType('inline-editable-list', InlineEditableListComponent, theme)
        breakPointObserver.observe([Breakpoints.XSmall]).subscribe(() => {
            const xs = breakPointObserver.isMatched(Breakpoints.XSmall)
            this.sideBarMode = xs ? 'over' : 'side'
            this.isSidebarOpened = !xs
        })
    }
}