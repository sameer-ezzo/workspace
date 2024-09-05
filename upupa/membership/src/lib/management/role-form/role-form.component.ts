import { Component, Input, SimpleChanges } from '@angular/core';

import { AuthService } from '@upupa/auth';
import { DataService, ObjectId } from '@upupa/data';
import { FormDesign, FormScheme, textField } from '@upupa/dynamic-form';
import { ActionEvent } from '@upupa/common';
import { DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'role-form',
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss'],
})
export class RoleFormComponent {
  loading = false;

  @Input() role: any = { _id: ObjectId.generate() };
  r: any;
  design: FormDesign = {} as FormDesign;

  private readonly _fields = {
    _id: textField('_id', 'Name', 'Role name or code', undefined, 'outline', [
      { name: 'required' },
    ]),
    name: textField('name', 'Display', 'Role name', undefined, 'outline', [
      { name: 'required' },
    ]),
  };
  fields: FormScheme;

  constructor(
    public auth: AuthService,
    public data: DataService,
  ) {}
  _readonly = false;
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['role']) {
      if (!this.role) this.role = { _id: ObjectId.generate() };
      else this._readonly = true;

      if (this.role?._id === null)
        throw 'Invalid role object passed to component';
    }

    this.fields = { ...this._fields };
    this.fields['_id'].ui.inputs['readonly'] = this._readonly;
  }

  async onAction(e: ActionEvent) {
    const dialogRef = e.context.dialogRef;
    if (e.action.name === 'submit') {
      try {
        await this.save();
        dialogRef.close(this.role);
      } catch (error) {
        console.error(error);
      }
    } else dialogRef.close();
  }
  dialogRef: DialogRef;
  discard() {
    this.dialogRef?.close();
  }
  async save() {
    if (!this.role._id) throw new Error('Missing role id!');
    const _role = Object.assign({}, this.role);
    delete _role._id;
    await this.data.put(`/role/${this.role._id}`, _role);
  }
}
