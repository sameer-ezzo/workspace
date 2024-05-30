import { Component, OnInit, Optional, Inject, DestroyRef, inject, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { ActionDescriptor, ActionEvent } from '../mat-btn/action-descriptor';

import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, startWith } from 'rxjs';
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
  imports: [MatDialogModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule],
})
export class PromptComponent implements UpupaDialogPortal<PromptComponent>, OnInit {

  promptText = 'Please enter value';
  promptTitle = 'Prompt';
  promptNoButton = 'No';
  promptYesButton = 'Yes';
  placeholder = '';


  type = 'text';
  required = false;
  dialogRef?: MatDialogRef<UpupaDialogComponent>;
  dialogActions?: WritableSignal<ActionDescriptor[]>;

  appearance: MatFormFieldAppearance = 'outline';
  valueFormControl = new UntypedFormControl('', []);
  private readonly destroyRef = inject(DestroyRef)

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    const data = this.data;
    if (data.appearance !== undefined) { this.appearance = data.appearance; }
    if (data.text !== undefined) { this.promptText = data.text; }
    if (data.placeholder !== undefined) { this.placeholder = data.placeholder; }
    this.required = data.required === true;

    const validators = this.required ? [Validators.required] : [];
    this.type = data.type || 'text';
    if (data.type != null) {
      if (this.type === 'number')
        this.valueFormControl = new FormControl<number>(+(data.value || '0'), [...validators]);
      else if (this.type === 'email')
        this.valueFormControl = new FormControl<string>(data.value || '', [...validators, Validators.email]);
      else
        this.valueFormControl = new FormControl<string>(data.value || '', [...validators]);
    }
    this.valueFormControl.updateValueAndValidity();

    this.valueFormControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      startWith(this.valueFormControl.value),
      debounceTime(100),
    ).subscribe(v => {
      this.updateActionsState()
    })
  }
  private updateActionsState() {
    const actions = this.dialogActions().map(a => {
      const action = { ...a, disabled: false }
      if (a.type === 'submit') action.disabled = this.valueFormControl.invalid
      return action
    });
    this.dialogActions.set(actions);
  }

  submit(e) {
    e.stopPropagation();
    e.preventDefault();
    if (this.valueFormControl.invalid) return
    this.dialogRef.close(this.valueFormControl.value)
  }

  async onAction(e: ActionEvent, ref: MatDialogRef<UpupaDialogComponent>): Promise<any> {
    // ref ??= this.dialogRef
    // ref.close(this.valueFormControl.value)
  }

}
