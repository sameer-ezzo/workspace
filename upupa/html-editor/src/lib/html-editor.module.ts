import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { HtmlEditorComponent } from './html-component/html-editor.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HTML_EDITOR_CONFIG, HTML_EDITOR_UPLOAD_BASE } from './di.token';
import { TranslationModule } from '@upupa/language';
import { UtilsModule } from '@upupa/common';
import { UploadModule } from '@upupa/upload';
import { type Editor, EditorConfig } from '@ckeditor/ckeditor5-core';


export type CKEditorConfig = EditorConfig




@NgModule({
    declarations: [HtmlEditorComponent],
    imports: [
        CommonModule,
        UtilsModule,
        CKEditorModule,
        MatFormFieldModule,
        TranslationModule,
        UploadModule
    ],
    exports: [HtmlEditorComponent, CKEditorModule]
})
export class HtmlEditorModule {

    public static register(
        uploadBase: string,
        editorConfig?: CKEditorConfig):
        ModuleWithProviders<HtmlEditorModule> {
        return {
            ngModule: HtmlEditorModule,
            providers: [
                { provide: HTML_EDITOR_UPLOAD_BASE, useValue: (uploadBase || '/storage').trim().replace(/\/$/, '') },
                { provide: HTML_EDITOR_CONFIG, useValue: editorConfig }
            ]
        };
    }

}
