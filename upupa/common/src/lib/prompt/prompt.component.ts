import { Component, OnInit, Optional, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { ActionEvent } from '../mat-btn/action-descriptor';

import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'prompt',
  templateUrl: 'prompt.component.html',
  standalone: true,
  imports: [MatDialogModule, MatInputModule, MatFormFieldModule, FormsModule, CommonModule],
})
export class PromptComponent {

  promptText = 'Please enter value';
  promptTitle = 'Prompt';
  promptNoButton = 'No';
  promptYesButton = 'Yes';
  placeholder = '';

  value: string;

  type = 'text';
  required = false;

  appearance: MatFormFieldAppearance = 'outline';

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data.appearance !== undefined) { this.appearance = data.appearance; }
    if (data.text !== undefined) { this.promptText = data.text; }
    if (data.placeholder !== undefined) { this.placeholder = data.placeholder; }

    if (data.type !== undefined) { this.type = data.type; }

    this.required = data.required === true;
    this.valueChange(data.value ?? '');
  }

  valueChange(val) {
    this.value = val;
    if (this.required === true) {
      this.data.actions[0].disabled = `${this.value}`.trim().length === 0;
      this.data.actions[0].meta.closeDialog = !this.data.actions[0].disabled;
      this.data.actions = this.data.actions.slice();
    }
  }

  onAction(e: ActionEvent): any {
    // this.componentPortal.component.value;

    return this.value;
  }

}
