import { Route, Routes } from '@angular/router';
import { DataFormComponent } from '../data-form/data-form.component';
import { DataListComponent } from '../data-list/data-list.component';
import { MediaLibraryComponent } from '../media-library/media-library.component';
import { RolesListComponent, UsersListComponent } from '@upupa/membership';
import { PermissionsPageComponent } from '@upupa/permissions';
import { TagsComponent } from '@upupa/tags';

export const listRoute = { path: 'list/:collection', component: DataListComponent, runGuardsAndResolvers: 'pathParamsChange' } as Route
export const createRoute = { path: 'create/:collection', component: DataFormComponent }
export const editRoute = { path: 'edit/:collection/:id', component: DataFormComponent }
export const usersRoute = { path: 'users', component: UsersListComponent }
export const rolesRoute = { path: 'roles', component: RolesListComponent }
export const permissionsRoute = { path: 'permissions', component: PermissionsPageComponent }
export const storageRoute = { path: 'storage', component: MediaLibraryComponent }
export const taxonomiesRoute = { path: 'taxonomies', component: TagsComponent }

export const cpRoutes: Routes = [
    // listRoute,
    // createRoute,
    // editRoute,
    usersRoute,
    rolesRoute,
    permissionsRoute,
    storageRoute,
    taxonomiesRoute
]