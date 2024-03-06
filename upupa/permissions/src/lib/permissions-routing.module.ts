import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PermissionsPageComponent } from './permissions-page/permissions-page.component';





const routes: Routes = [
  { path: 'permissions', component: PermissionsPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PermissionsRoutingModule { }
