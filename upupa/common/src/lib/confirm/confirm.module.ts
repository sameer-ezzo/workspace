import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationModule } from '@upupa/language';

import { ConfirmComponent } from './confirm.component';
import { ConfirmDirective } from './confirm.directive';
import { PromptComponent } from '../prompt/prompt.component';
import { PromptDirective } from '../prompt/prompt.directive';


@NgModule({
    declarations: [ConfirmDirective, ConfirmComponent, PromptComponent, PromptDirective],
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        TranslationModule,
        FormsModule,
        MatInputModule
    ],
    exports: [ConfirmDirective, ConfirmComponent, PromptComponent, PromptDirective]
})
export class ConfirmModule { }
