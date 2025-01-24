import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersTableComponent } from './users-list/users-list.component';
import { RolesListComponent } from './roles-list/roles-list.component';



const routes: Routes = [
  { path: 'users', component: UsersTableComponent },
  { path: 'roles', component: RolesListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserManagementRoutingModule { }
