import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';

import { UtilsModule } from '@upupa/common';
import { UploadModule } from '@upupa/upload';

@NgModule({
    imports: [CommonModule, UtilsModule, MatFormFieldModule, UploadModule],
    exports: [],
})
export class HtmlEditorModule {}
