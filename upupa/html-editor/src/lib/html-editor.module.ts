import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';

import { HtmlEditorComponent } from './html-component/html-editor.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HTML_EDITOR_CONFIG, HTML_EDITOR_UPLOAD_BASE } from './di.token';

import { UtilsModule } from '@upupa/common';
import { UploadModule } from '@upupa/upload';
import { EditorConfig } from 'ckeditor5';

@NgModule({
    imports: [CommonModule, UtilsModule, MatFormFieldModule, UploadModule],
    exports: [],
})
export class HtmlEditorModule {
    // public static register(
    //     uploadBase: string,
    //     editorConfig?: EditorConfig
    // ): ModuleWithProviders<HtmlEditorModule> {
    //     return {
    //         ngModule: HtmlEditorModule,
    //         providers: [
    //             {
    //                 provide: HTML_EDITOR_UPLOAD_BASE,
    //                 useValue: uploadBase ?? '/storage',
    //             },
    //             { provide: HTML_EDITOR_CONFIG, useValue: editorConfig },
    //         ],
    //     };
    // }
}
