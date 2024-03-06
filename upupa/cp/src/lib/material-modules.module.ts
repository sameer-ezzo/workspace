

import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTreeModule } from '@angular/material/tree';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import {MatDividerModule} from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

const adminModules = [
	MatToolbarModule,
	MatDividerModule,
	MatSidenavModule,
	MatRadioModule,
	MatSnackBarModule,
	MatTableModule,
	MatPaginatorModule,
	MatSortModule,
	MatChipsModule,
	MatAutocompleteModule,
	MatTreeModule,
	MatProgressSpinnerModule,
	MatCardModule,
	MatDialogModule,
	MatDatepickerModule,
	MatNativeDateModule,
	DragDropModule,
	MatMenuModule,
	MatBadgeModule,
	MatDialogModule,
	MatTooltipModule,
	MatProgressSpinnerModule,
	MatProgressBarModule,
	MatToolbarModule,
	MatSidenavModule,
	MatIconModule,
	MatButtonModule,
	MatChipsModule,
	MatFormFieldModule,
	MatInputModule,
	MatSelectModule,
	MatCheckboxModule,
	MatTabsModule,
	MatExpansionModule,
    MatButtonToggleModule
];

@NgModule({
	imports: [adminModules],
	exports: [adminModules]
})
export class MaterialModulesModule { }
