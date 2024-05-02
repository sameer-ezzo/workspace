import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslationModule } from '@upupa/language';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBtnComponent } from './mat-btn.component';
import { MatTooltipModule } from '@angular/material/tooltip';

const material = [MatButtonModule, MatBadgeModule, MatIconModule];


@NgModule({
  declarations: [MatBtnComponent],
  imports: [
    CommonModule,
    MatTooltipModule,
    TranslationModule,
    ...material
  ],
  exports: [
    MatBtnComponent,
    ...material
  ]
})
export class MatBtnModule { }
