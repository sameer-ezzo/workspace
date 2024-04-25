import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { LanguageModule, TranslationModule } from '@upupa/language';

import { ErrorPipe } from './error.pipe';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { OnlyNumberDirective } from './directives/only-numbers.directive';
import { PortalModule } from '@angular/cdk/portal';
import { MatBtnModule } from './mat-btn/mat-btn.module';
import { UpupaDialogComponent } from './upupa-dialog/upupa-dialog.component';
import { HtmlPipe } from './html.pipe';
import { InputBaseComponent, BaseTextInputComponent } from './input-base.component';
import { LazyLoadDirective } from './lazy-load.directive';
import { MarkdownPipe } from './markdown.pipe';

const declarations = [
    InputBaseComponent,
    BaseTextInputComponent,
    UpupaDialogComponent,
    OnlyNumberDirective,
    HtmlPipe, MarkdownPipe,
    LazyLoadDirective,
    ErrorPipe];

const imports = [MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    PortalModule,
    MatBtnModule,
    LanguageModule,
    MatIconModule,
    MatButtonModule,
    TranslationModule,
    ReactiveFormsModule
]
@NgModule({
    declarations,
    imports: [
        CommonModule,
        FormsModule,
        ...imports
    ],
    exports: [...declarations,
    ...imports
    ]
})
export class UtilsModule { }
