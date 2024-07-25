import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, Inject, Input, signal, ViewEncapsulation } from '@angular/core'
import { LanguageService } from '@upupa/language'
import { AuthService } from '@upupa/auth'
import { Subject } from 'rxjs'
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { MatDrawerMode } from '@angular/material/sidenav'
import { InlineEditableListComponent } from '../inline-editable-list/inline-editable-list.component'
import { SideBarGroup, SideBarItem } from './side-bar-group-item'
import { DynamicFormService } from '@upupa/dynamic-form'
import { DEFAULT_THEME_NAME } from '@upupa/dynamic-form'
import { CP_SIDE_BAR_ITEMS, SCAFFOLDING_SCHEME } from '../di.token'
import { MatAccordion, MatExpansionPanel } from '@angular/material/expansion'

@Component({
  selector: 'cp-layout',
  templateUrl: './cp-layout.component.html',
  styleUrls: ['./cp-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CpLayoutComponent {


  sideBarItems = signal([])

  getId = (g, i) => 'accordion_' + (g.name || i)
  hasActiveChild(el: MatExpansionPanel) {
    return el._body?.nativeElement.querySelector('.active') !== null
  }

  @Input() logo: string | null = null

  private _sideBarCommands = [] as SideBarGroup[]
  @Input()
  public get sideBarCommands() {
    return this._sideBarCommands
  }
  public set sideBarCommands(value) {
    if (!value) return
    this._sideBarCommands = value
    this.sideBarItems.set(value)
  }
  @Input() userMenuCommands: SideBarItem[]
  @Input() sideBarMode: MatDrawerMode = 'side'
  @Input() isSidebarOpened = false

  private theme = inject(DEFAULT_THEME_NAME)
  private dfForm = inject(DynamicFormService)
  public languageService = inject(LanguageService)
  public breakPointObserver = inject(BreakpointObserver)
  public auth = inject(AuthService)
  private readonly el = inject(ElementRef)
  constructor() {
    const t = inject(CP_SIDE_BAR_ITEMS) ?? this.sideBarCommands ?? []

    if (Array.isArray(t)) this.sideBarItems.set(t)
    else if (t instanceof Promise) t.then(this.sideBarItems.set)
    else t.subscribe(r => this.sideBarItems.set(r))

    effect(() => {
      const items = this.sideBarItems()
      setTimeout(() => {
        const cpItems = this.el.nativeElement.querySelectorAll('.cp-accordion')
        cpItems.forEach((accEl: HTMLElement) => {
          const links = accEl.querySelectorAll('.cp-item-link')
          const allHidden = Array.from(links).every((l: HTMLElement) => l.style.display === 'none')
          accEl.style.display = allHidden === true ? 'none' : 'block'
        })
      }, 500);
    })
  }

  ngOnInit() {

    this.dfForm.addControlType('inline-editable-list', InlineEditableListComponent, this.theme)
    this.breakPointObserver.observe([Breakpoints.XSmall]).subscribe(() => {
      const xs = this.breakPointObserver.isMatched(Breakpoints.XSmall)
      this.sideBarMode = xs ? 'over' : 'side'
      this.isSidebarOpened = !xs
    })
  }
}

/*
private readonly scheme = inject(SCAFFOLDING_SCHEME)
private readonly layoutOptions = inject(CP_LAYOUT_OPTIONS_FACTORY)
  private readonly permissions = inject(PermissionsService)
  public readonly router = inject(Router)
  public readonly languageService = inject(LanguageService)
  public readonly auth = inject(AuthService)
  dir$ = this.languageService.dir$

  user = null as Principle
  commands$ = this.auth.user$
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .pipe(
      filter((user: Principle) => user?.['sub'] != this.user?.sub),
      tap((user: Principle) => { this.user = user }),
      map((user: Principle) => createCommandsMap(user as Principle, this.scheme)),
      takeUntilDestroyed()
    )

  sideBarCmds$ = this.commands$.pipe(map(cmds => cmds.get('sidebar')))
  userMenuCmds$: Observable<SideBarItem[]> = this.commands$.pipe(
    map(cmds => cmds.get('user-menu')),
    map(groups => groups.map(g => g.items).flat())
  )
}


function createCommandsMap(user: Principle, scaffoldingScheme: ScaffoldingScheme): Map<CPCommandPosition, SideBarGroup[]> {

  const allItems = Object.entries({ ...scaffoldingScheme['list'] })
    .map(([key, value]) => {
      const meta = value['meta']
      const { icon, text, group, positions } = meta

      return (positions || []).filter(p => p !== null).map(position => ({
        name: key,
        text: text || toTitleCase(key),
        icon: icon,
        position: position || 'sidebar',
        group,
        link: `./list/${key}`
      }))
    }).flat()


  const commands = new Map<CPCommandPosition, SideBarGroup[]>();
  const itemsByPosition = groupBy(allItems, 'position');

  Object.entries(itemsByPosition).forEach(([position, all]) => {
    const groups = groupBy(all, 'group');
    const items = Object.entries(groups).map(([key, items]) => {
      return (key === 'undefined' ? { items } : {
        text: toTitleCase(key),
        action: key,
        // roles: value
        items
      }) as SideBarGroup
    })
    const itemsWithNoGroups = items.filter(i => !i.text).sort((a, b) => a.text.localeCompare(b.text))
    const itemsWithGroups = items.filter(i => i.text).sort((a, b) => (a['order'] || 0) - (b['order'] || 0))
    commands.set(position as 'sidebar' | 'user-menu', [...itemsWithNoGroups, ...itemsWithGroups]);
  })

  commands.set('sidebar', [
    { items: [
      { path: '/payment', action: 'View Payments List', icon: 'payments', text: 'Payments', link: `./payments` }] } as SideBarGroup,
    ...commands.get('sidebar'),
    {
      name: 'users_and_permissions',
      text: 'Users',
      items: [
        { name: 'users_list', path: '/auth', action: 'read', icon: 'manage_accounts', text: 'Users', link: `./users` },
        { name: 'roles_list', path: '/api/role', action: 'read', icon: 'contact_emergency', text: 'roles', link: `./roles` },
        { name: 'permissions_list', path: '/permissions', action: 'read', icon: 'app_blocking', text: 'Permissions', link: `./permissions` }
      ]
    }
  ] as any)
  // filter out items that the user does not have permission to see
  // filter out items that the user does not have permission to excute and mark them as disabled

  return commands;
}
 */