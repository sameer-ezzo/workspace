import { ModuleWithProviders, NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationModule } from '@upupa/language';

import { UtilsModule } from '@upupa/common';
import { RouterModule } from '@angular/router';
import { PermissionsRoutingModule } from './permissions-routing.module';
import { DynamicFormModule } from '@upupa/dynamic-form';
import { DataModule } from '@upupa/data';
import { DataTableModule } from '@upupa/table';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthModule } from '@upupa/auth';
import { RuleFormComponent } from './rule-form/rule-form.component';
import { PermissionsPageComponent } from './permissions-page/permissions-page.component';
import { PermissionsSideBarComponent } from './permissions-side-bar/permissions-side-bar.component';
import { RulePermissionsTableComponent } from './rule-permissions-table/rule-permissions-table.component';

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AUTHORIZATION_TEMPLATES } from '@noah-ark/expression-engine';
import { AuthorizeModule } from '@upupa/authz';



const components = [
    PermissionsPageComponent, PermissionsSideBarComponent, RuleFormComponent, RulePermissionsTableComponent
];

@NgModule({
    declarations: [...components],
    exports: [...components],
    imports: [CommonModule,
        AuthorizeModule,
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
        DataTableModule,
        MatProgressBarModule,
        DataModule],
    providers: [
        provideHttpClient(withInterceptorsFromDi())
    ],
})
export class PermissionsModule {
    static forRoot(options: {}, authorizationTemplates: { by: string, template: typeof AUTHORIZATION_TEMPLATES[string] }[] = []): ModuleWithProviders<RouterModule> {
        for (const template of authorizationTemplates) {
            if (!AUTHORIZATION_TEMPLATES[template.by])
                AUTHORIZATION_TEMPLATES[template.by] = template.template
        }
        return {
            ngModule: PermissionsModule,
            providers: [

            ]
        }
    }
}


