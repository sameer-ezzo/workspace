import { Component, Inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FieldItem, ValidationTask } from '../types/types';

@Component({
    selector: 'task-validation-component',
    templateUrl: './task.validation.component.html',
})
export class TaskValidationComponent {
    task: ValidationTask;
    control: AbstractControl;
    field: FieldItem;
    constructor(
        public dialogRef: MatDialogRef<TaskValidationComponent>,
        @Inject(MAT_DIALOG_DATA) data: any,
    ) {
        this.task = data.task;
        this.control = data.control;
        this.field = data.field;
    }

    code: string;

    async runConfirmationTask() {
        this.task.disabled = true;
        this.task.confirm.state = 'error';

        let result;
        try {
            result = await this.task.confirm.task('', { value: this.control.value, code: this.code });
            if (result === null || result === true || result['token']) {
                this.task.state = this.task.confirm.state = 'check';
                this.task.confirm = null;
            } else {
                this.task.error = result;
                this.task.confirm.state = 'error';
            }
        } catch (error) {
            this.task.confirm.state = 'error';
        }

        this.task.disabled = false;
        this.control.updateValueAndValidity({ emitEvent: false });

        if (!this.task.confirm) this.dialogRef.close(result['token']);
    }

    async runValidationTask() {
        if (this.task.disabled || this.task.state === 'check') return;

        this.task.state = 'error';

        try {
            const result = await this.task.task('', this.control.value);
            if (result === null || result === true) this.task.state = 'check';
            else if (result['code']) {
                this.task.state = 'vpn_key';
                this.task.confirm = result['code'];
                this.task.confirm.state = 'vpn_key';
            } else {
                this.task.error = result;
                this.task.state = 'error';
            }
        } catch (error) {
            this.task.state = 'error';
        }

        this.control.updateValueAndValidity({ emitEvent: false });
    }
}
