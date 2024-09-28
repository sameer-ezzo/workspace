import { ModuleWithProviders, NgModule, Provider } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DataFormComponent } from "./data-form/data-form.component";
import { DataListComponent } from "./data-list/data-list.component";
import {  CP_OPTIONS, SCAFFOLDING_SCHEME, USER_PICTURE_RESOLVER } from "./di.token";
import { CpLayoutComponent } from "./cp-layout/cp-layout.component";
import {
    InlineEditableListComponent,
    InlineEditableListFormComponent,
} from "./inline-editable-list/inline-editable-list.component";
import { AuthModule, AuthService } from "@upupa/auth";
import { DataModule, DataService } from "@upupa/data";
import { DynamicFormModule } from "@upupa/dynamic-form";
import { DataTableModule } from "@upupa/table";
import { UploadModule } from "@upupa/upload";
import { PopoverModule } from "@upupa/popover";
import { LanguageModule, TranslationModule } from "@upupa/language";
import { MaterialModulesModule } from "./material-modules.module";
import { RouterModule } from "@angular/router";
import { UtilsModule } from "@upupa/common";
import { ToolbarUserMenuComponent } from "./tool-bar-user-menu/tool-bar-user-menu.component";
import { MatSidenavModule } from "@angular/material/sidenav";
import { DataFilterFormComponent } from "./data-filter-form/data-filter-form.component";
import { cpRoutes } from "./conf/routes";
import { MembershipModule, UsersManagementModule } from "@upupa/membership";
import { MediaLibraryComponent } from "./media-library/media-library.component";
import { DynamicFormNativeThemeModule } from "@upupa/dynamic-form-native-theme";
import { mergeScaffoldingScheme, scaffoldingScheme } from "./decorators/scheme.router.decorator";
import { TagsModule, TagsPipe } from "@upupa/tags";
import { PermissionsModule } from "@upupa/permissions";
import { getUserInitialsImage } from "./user-image.service";
import { catchError, map, of, switchMap } from "rxjs";
import { DbI18nPipe } from "./dbI18n.pipe";
import { AuthorizeModule } from "@upupa/authz";
import { MatBtnComponent } from "@upupa/mat-btn";
import { DataListWithInputsComponent } from "./data-list-with-inputs/data-list-with-inputs.component";
import { DataFormWithViewModelComponent } from "./data-form-with-view-model/data-form-with-view-model.component";

const userImageProvider = {
    provide: USER_PICTURE_RESOLVER,
    useFactory: (auth: AuthService, data: DataService) => {
        if (!auth.user$) return of(getUserInitialsImage(''))
        return auth.user$.pipe(
            switchMap(u =>
                data.get<{ picture: string }>(`/user/${u.sub}?select=picture`).pipe(
                    map(res => res.data?.[0]),
                    map(x => x.picture as string),
                    catchError(e => of(getUserInitialsImage(u.name ?? u.email)))
                )
            )
        )
    }, deps: [AuthService, DataService]
}
const ScaffoldersProvider = { provide: SCAFFOLDING_SCHEME, useValue: scaffoldingScheme }

@NgModule({
    imports: [
        CommonModule,
        UtilsModule,
        MatSidenavModule,
        RouterModule,
        MaterialModulesModule,
        AuthModule,
        LanguageModule,
        TranslationModule,
        DataModule,
        DynamicFormNativeThemeModule,
        DynamicFormModule,
        DataTableModule.forRoot([TagsPipe, DbI18nPipe]),
        UploadModule,
        PopoverModule,
        RouterModule.forChild(cpRoutes),
        UsersManagementModule,
        MembershipModule,
        TagsModule,
        AuthorizeModule,
        PermissionsModule,
        MatBtnComponent
    ],
    providers: [
        ScaffoldersProvider,
        { provide: CP_OPTIONS, useValue: { userAvatarMode: 'avatar' } },
        userImageProvider,
    ]
})
export class ControlPanelModule {
    public static register(options: {
        providers?: any[],
    } = {
            providers: [userImageProvider]
        }): ModuleWithProviders<ControlPanelModule> {
        const scaffolders = mergeScaffoldingScheme()

        return {
            ngModule: ControlPanelModule,
            providers: [
                // { provide: CP_LAYOUT_OPTIONS_FACTORY, useFactory: viewModelsFactory.factory, deps: viewModelsFactory.deps },
                // {
                //     provide: SCAFFOLDING_SCHEME,
                //     useValue: scaffolders,
                // },
                {
                    provide: CP_OPTIONS,
                    useValue: options ?? {},
                },
                userImageProvider,
                ...(options.providers ?? [])
            ],
        };
    }
}
