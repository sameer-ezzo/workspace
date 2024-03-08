import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationModule } from '@upupa/language';

import { UtilsModule } from '@upupa/common';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { PermissionsRoutingModule } from './permissions-routing.module';
import { DynamicFormModule } from '@upupa/dynamic-form';
import { DataModule } from '@upupa/data';
import { DataTableModule } from '@upupa/table';
import { HttpClientModule } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AuthModule } from '@upupa/auth';
import { RuleFormComponent } from './rule-form/rule-form.component';
import { PermissionsPageComponent } from './permissions-page/permissions-page.component';
import { PermissionsSideBarComponent } from './permissions-side-bar/permissions-side-bar.component';
import { RulePermissionsTableComponent } from './rule-permissions-table/rule-permissions-table.component';
import { APP_ADMIN_ROLES_TOKEN } from './app-admin-roles.token'
import { appDefaultAdminRoles } from './user-role';

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthorizeActionDirective } from "./authorize-action.directive";

const components = [
    AuthorizeActionDirective,
    PermissionsPageComponent, PermissionsSideBarComponent, RuleFormComponent, RulePermissionsTableComponent
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        TranslationModule,
        PermissionsRoutingModule,
        UtilsModule,
        DynamicFormModule,
        AuthModule,
        MatExpansionModule,
        HttpClientModule,
        DataTableModule,
        MatProgressBarModule,
        DataModule],
    declarations: [...components],
    exports: [...components],
    providers: [{ provide: APP_ADMIN_ROLES_TOKEN, useValue: appDefaultAdminRoles }]
})
export class PermissionsModule {
}


