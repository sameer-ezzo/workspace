import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";

import { ErrorPipe } from "./error.pipe";

import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDialogModule } from "@angular/material/dialog";
import { OnlyNumberDirective } from "./directives/only-numbers.directive";
import { HtmlPipe } from "./html.pipe";
import { InputBaseComponent } from "./input-base.component";
import { FocusDirective } from "./directives/focus.directive";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatBadgeModule } from "@angular/material/badge";
import { PortalComponent } from "./portal.component";

const declarations = [];

const imports = [
    ErrorPipe,
    FocusDirective,
    HtmlPipe,
    OnlyNumberDirective,
    InputBaseComponent,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
    MatIconModule,
    ReactiveFormsModule,
    MatBadgeModule,
    MatTooltipModule,
    PortalComponent,
];
@NgModule({
    declarations,
    imports: [CommonModule, FormsModule, ...imports],
    exports: [...declarations, ...imports],
})
export class UtilsModule {}
