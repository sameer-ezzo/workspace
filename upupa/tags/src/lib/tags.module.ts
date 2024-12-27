import { CommonModule } from "@angular/common";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { ModuleWithProviders, NgModule } from "@angular/core";
import { TagsComponent } from "./tags.component";
import { TagFormComponent } from "../lib/tag-form/tag-form.component";
import { MatDialogModule } from "@angular/material/dialog";

import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { TagsChipsInputComponent } from "./tags-chips-input/tags-chips-input.component";
import { MatChipsModule } from "@angular/material/chips";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";

const declarations = [];
const imports = [
    CommonModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatDialogModule,
    TagsComponent,
    TagsChipsInputComponent,
    TagFormComponent,
];
@NgModule({
    declarations,
    exports: [...declarations, MatDialogModule],
    imports: [...imports],
    providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class TagsModule {
    public static forRoot(): ModuleWithProviders<TagsModule> {
        return {
            ngModule: TagsModule,
            providers: [...declarations],
        };
    }
}
