import { ModuleWithProviders, NgModule } from "@angular/core";
import { UsersComponent } from "./users.component";
import { UsersListComponent } from "./users-list/users-list.component";
import { AdminResetPasswordComponent } from "./admin-reset-pwd/admin-reset-pwd.component";
import { UserFormComponent } from "./user-form/user-form.component";
import { ChangePasswordComponent } from "./change-password/change-password.component";
import { DataModule } from "@upupa/data";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { UtilsModule } from "@upupa/common";
import { DataTableModule, TableHeaderComponent } from "@upupa/table";
import { MatSelectModule } from "@angular/material/select";
import { USERS_MANAGEMENT_OPTIONS } from "./di.token";
import { UsersManagementOptions } from "./types";
import { DynamicFormModule } from "@upupa/dynamic-form";
import { RolesListComponent } from "./roles-list/roles-list.component";
import { RoleFormComponent } from "./role-form/role-form.component";
import { UserManagementRoutingModule } from "./users-management-routing.module";
import { MatTableModule } from "@angular/material/table";
import { MatExpansionModule } from "@angular/material/expansion";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { AdminUserPasswordRestComponent } from "./admin-userpwd-reset/admin-userpwd-reset.component";
import { EditUserRolesComponent } from "./edit-user-roles/edit-user-roles.component";
import { MatDialogModule } from "@angular/material/dialog";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatBtnComponent } from "@upupa/mat-btn";

const defaultOptions = new UsersManagementOptions();

const imports = [
    CommonModule,
    UserManagementRoutingModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatExpansionModule,
    MatDialogModule,
    MatTooltipModule,
    UtilsModule,
    DataTableModule,
    DataModule,
    DynamicFormModule,
    TableHeaderComponent,
    MatBtnComponent,
    UsersComponent,
    EditUserRolesComponent,
    UsersListComponent,
    AdminResetPasswordComponent,
    AdminUserPasswordRestComponent,
    UserFormComponent,
    ChangePasswordComponent,
    RolesListComponent,
    RoleFormComponent,
];
const declarations = [];
@NgModule({
    imports: imports,
    declarations: declarations,
    providers: [provideHttpClient(withInterceptorsFromDi()), { provide: USERS_MANAGEMENT_OPTIONS, useValue: defaultOptions }],
    exports: [...declarations],
})
export class UsersManagementModule {
    public static forRoot(options: Partial<UsersManagementOptions> = defaultOptions): ModuleWithProviders<UsersManagementModule> {
        const ops = { ...defaultOptions, ...options };
        return {
            ngModule: UsersManagementModule,
            providers: [{ provide: USERS_MANAGEMENT_OPTIONS, useValue: ops }],
        };
    }
}
