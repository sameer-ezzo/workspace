import { ChangeDetectionStrategy, Component, Inject, Input, SimpleChanges, ViewEncapsulation } from '@angular/core'
import { LanguageService } from '@upupa/language'
import { AuthService } from '@upupa/auth'

import { Router } from '@angular/router'
import { Subject } from 'rxjs'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { MatDrawerMode } from '@angular/material/sidenav'
import { InlineEditableListComponent } from '../inline-editable-list/inline-editable-list.component'
import { SideBarGroup } from './side-bar-group-item'
import { AvatarMode, UserAvatarService } from './avatar.service'
import { DynamicFormService } from '@upupa/dynamic-form'
import { DEFAULT_THEME_NAME } from '@upupa/dynamic-form'

@Component({
    selector: 'cp-layout',
    templateUrl: './cp-layout.component.html',
    styleUrls: ['./cp-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class CpLayoutComponent {

    @Input() logo: string | null = null
    @Input() userAvatarMode: AvatarMode
    @Input() sideBarCommands: SideBarGroup[]
    @Input() userMenuCommands: SideBarGroup[]
    sidebarCmds: SideBarGroup[] = []
    @Input() sideBarMode: MatDrawerMode = 'side'
    @Input() isSidebarOpened = false

    destroyed$ = new Subject()

    constructor(public auth: AuthService,
        public avatarService: UserAvatarService,
        private router: Router,
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

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['sideBarCommands'] && this.sideBarCommands) {
            const cmds = this.sideBarCommands.filter(cmds => cmds != null)

            this.sidebarCmds = cmds
            const path = this.router.url.split('?')[0]
            const expanded = cmds.slice().filter(cmd => cmd.items.find(p => path.includes(p.link))).shift()
            if (expanded) this.expand(cmds.indexOf(expanded))
            else this.expand(0)
        }
    }

    expand(index: number) {
        const cmds = this.sidebarCmds?.slice()
        if (cmds?.length < 1) return
        cmds.forEach(cmd => cmd.active = false)
        cmds[index].active = true
        this.sidebarCmds = cmds
    }

    changeLang(lang: string) {
        const url = this.router.url.substring(4)
        this.router.navigateByUrl(`/${lang}/${url}`)
    }
}