import { ModuleWithProviders, NgModule } from '@angular/core';
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
import { HtmlPipe } from './html.pipe';
import { InputBaseComponent, BaseTextInputComponent } from './input-base.component';
import { LazyLoadDirective } from './directives/lazy-load.directive';
import { MarkdownPipe } from './markdown.pipe';
import { FocusDirective } from './directives/focus.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

const declarations = [
    InputBaseComponent,
    BaseTextInputComponent,
    OnlyNumberDirective,
    HtmlPipe,
    MarkdownPipe,
    LazyLoadDirective,
    FocusDirective,
    ErrorPipe
];

const imports = [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    PortalModule,
    LanguageModule,
    MatIconModule,
    TranslationModule,
    ReactiveFormsModule,
    MatBadgeModule,
    MatTooltipModule,
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
export class UtilsModule {

}
