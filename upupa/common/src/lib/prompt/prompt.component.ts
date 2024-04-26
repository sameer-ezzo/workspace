import { Component, OnInit, Optional, Inject, DestroyRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { ActionDescriptor, ActionEvent } from '../mat-btn/action-descriptor';

import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { UpupaDialogComponent, UpupaDialogPortal } from '../upupa-dialog/upupa-dialog.component';


@Component({
  selector: 'prompt',
  templateUrl: 'prompt.component.html',
  styles: [`
  :host{
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    padding: 1rem;
  }
  `],
  standalone: true,
  imports: [MatDialogModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule, CommonModule],
})
export class PromptComponent implements UpupaDialogPortal<PromptComponent>, OnInit {

  promptText = 'Please enter value';
  promptTitle = 'Prompt';
  promptNoButton = 'No';
  promptYesButton = 'Yes';
  placeholder = '';


  type = 'text';
  required = false;

  appearance: MatFormFieldAppearance = 'outline';
  valueFormControl = new UntypedFormControl('', []);
  private readonly destroyRef = inject(DestroyRef)
  submitButton!: ActionDescriptor
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    const data = this.data;
    if (data.appearance !== undefined) { this.appearance = data.appearance; }
    if (data.text !== undefined) { this.promptText = data.text; }
    if (data.placeholder !== undefined) { this.placeholder = data.placeholder; }
    this.required = data.required === true;

    const validators = this.required ? [Validators.required] : [];
    if (data.type !== undefined) {
      this.type = data.type;
      if (this.type === 'number')
        this.valueFormControl = new FormControl<number>(+(data.value || '0'), [...validators]);
      else if (this.type === 'email')
        this.valueFormControl = new FormControl<string>(data.value || '', [...validators, Validators.email]);
      else
        this.valueFormControl = new FormControl<string>(data.value || '0', [...validators]);
    }
    this.submitButton = data.dialogActions[0];

    this.valueFormControl.updateValueAndValidity();

    this.valueFormControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef), filter(() => this.valueFormControl.valid || !this.valueFormControl.touched)).subscribe(v => {
      this.submitButton = { ...this.submitButton, disabled: this.valueFormControl.invalid && this.valueFormControl.touched }
    })
  }

  submit(e) {
    this.onAction({ action: this.submitButton, data: this.valueFormControl.value }, this.dialogRef)
    e.stopPropagation();
    e.preventDefault();
  }
  dialogRef?: MatDialogRef<UpupaDialogComponent>;
  async onAction(e: ActionEvent, ref: MatDialogRef<UpupaDialogComponent>): Promise<any> {
    ref ??= this.dialogRef
    ref.close(this.valueFormControl.value)
  }
}
