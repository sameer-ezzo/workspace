import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { TagsComponent } from './tags.component';
import { TagFormComponent } from '../lib/tag-form/tag-form.component';
import { MatDialogModule } from '@angular/material/dialog';
import { DataTableModule } from '@upupa/table';
import { TranslationModule } from '@upupa/language';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TagsSelectInputComponent } from './tags-select-input/tags-select-input.component';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormMaterialThemeModule } from '@upupa/dynamic-form-material-theme';

const declarations = [TagsComponent, TagsSelectInputComponent, TagFormComponent];

@NgModule({
  declarations,
  imports: [
    CommonModule,
    HttpClientModule,
    MatDialogModule,
    DataTableModule,
    FormsModule,
    ReactiveFormsModule,
    TranslationModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatChipsModule,
    DynamicFormMaterialThemeModule
  ],
  exports: [...declarations, MatDialogModule]
})
export class TagsModule {

  public static forRoot(): ModuleWithProviders<TagsModule> {
    return {
      ngModule: TagsModule,
      providers: [
        ...declarations
      ]
    };
  }
}
