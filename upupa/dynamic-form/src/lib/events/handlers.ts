import { EventRecord } from '@noah-ark/event-bus';
import { JsonPointer } from '@noah-ark/json-patch';

import { DynamicFormComponent } from '../dynamic-form.component';
import { DynamicFormCommands, DynamicFormMessage } from './events';
import * as _ from 'lodash';
import { PathInfo } from '@noah-ark/path-matcher';
import { Field } from '../types';
import { AbstractControl } from '@angular/forms';

function _pattern(msg: string) {
    return new RegExp(`^${msg}(\\.[^\\.|\\s]+)?(\\.[^\\.|\\s]+)?$`);
}

function _path(path: string) {
    const segments = PathInfo.segments(path);
    return segments.join('/items/');
}
function state(control: AbstractControl, state: any) {
    if (state?.disabled === true) control.disable();
    else control.enable();
}
function dirty(control: AbstractControl, state: any) {
    if (state?.dirty === true) control.markAsDirty();
    else control.markAsPristine();
}
function touched(control: AbstractControl, state: any) {
    if (state?.touched === true) control.markAsTouched();
    else control.markAsUntouched();
}

function changeState(form, cmd) {
    const fs = cmd.payload.fields.map((f) => _path(f));
    const controls = Array.from(form.formRenderer.controls);

    fs.forEach((f) => {
        const control = controls.find(
            (c) => c[0].name === f
        )?.[1] as AbstractControl;
        state(control, cmd.payload.state);
        dirty(control, cmd.payload.state);
        touched(control, cmd.payload.state);
    });
}

export function DynamicFormHandler<TCommand extends DynamicFormMessage>(
    targetForm: DynamicFormComponent,
    command: string,
    callback: (form: DynamicFormComponent, cmd: EventRecord<TCommand>) => void
) {
    return targetForm.bus.on<TCommand>(_pattern(command)).subscribe((cmd) => {
        const payload = cmd.payload;

        if (cmd.match) {
            const targetFieldName = cmd.match[1];
            const targetFormName = cmd.match[2];

            if (targetFieldName && !payload.fields?.length)
                payload.fields = [targetFieldName];
            if (targetFormName && !payload.targetFormName)
                payload.targetFormName = targetFormName;
        }

        //only apply commands to targeted form or otherwise apply it on the source
        if (
            payload.targetFormName &&
            payload.targetFormName !== targetForm.name()
        )
            return;
        if (!payload.targetFormName && cmd.source !== targetForm) return;

        const form = targetForm;
        callback(form, cmd);
    });
}

export function InputVisibilityHandler(targetForm: DynamicFormComponent) {
    return DynamicFormHandler<DynamicFormCommands.ChangeVisibility>(
        targetForm,
        DynamicFormCommands.changeVisibility,
        (form, cmd) => {
            for (const field of cmd.payload.fields) {
                const path = _path(field);
                JsonPointer.set(
                    form.fields,
                    `${path}/ui/hidden`,
                    !cmd.payload.visibility
                );
            }
        }
    );
}

export function ChangeFormSchemeHandler(targetForm: DynamicFormComponent) {
    return DynamicFormHandler<DynamicFormCommands.ChangeFormScheme>(
        targetForm,
        DynamicFormCommands.changeFormScheme,
        (form, cmd) => {
            const path = _path(cmd.payload.fields);
            const newField = cmd.payload.newField;
            if (newField) JsonPointer.set(form.fields, path, newField);
            else JsonPointer.unset(form.fields, path);

            setTimeout(() => {
                form._fieldsChanged();
            }, 500);
        }
    );
}

export function MergeFormSchemeHandler(targetForm: DynamicFormComponent) {
    return DynamicFormHandler<DynamicFormCommands.ChangeFormScheme>(
        targetForm,
        DynamicFormCommands.changeFormScheme,
        (form, cmd) => {
            const path = _path(cmd.payload.fields);
            const newField = cmd.payload.newField;
            const existingField = JsonPointer.get<Field>(form.fields, path);
            if (newField)
                JsonPointer.set(
                    form.fields,
                    path,
                    _.merge({}, existingField, newField)
                );
            else JsonPointer.unset(form.fields, path);

            form._fieldsChanged();
        }
    );
}

export function ChangeInputsHandler(targetForm: DynamicFormComponent) {
    return DynamicFormHandler<DynamicFormCommands.ChangeInputs>(
        targetForm,
        DynamicFormCommands.changeInputs,
        (form, cmd) => {
            const inputs = cmd.payload.inputs;
            const path = _path(cmd.payload.fields);
            const currentInputs = JsonPointer.get(
                form.fields,
                `${path}/ui/inputs`
            );
            JsonPointer.set(form.fields, `${path}/ui/inputs`, {
                ...currentInputs,
                ...inputs,
            });
        }
    );
}

export function ChangeStateHandler(targetForm: DynamicFormComponent) {
    return DynamicFormHandler<DynamicFormCommands.ChangeState>(
        targetForm,
        DynamicFormCommands.changeState,
        (form, cmd) => changeState(form, cmd)
    );
}

export function ChangeValueHandler(targetForm: DynamicFormComponent) {
    return DynamicFormHandler<DynamicFormCommands.ChangeValue>(
        targetForm,
        DynamicFormCommands.changeValue,
        (form, cmd) => {
            const path = _path(cmd.payload.fields);
            const field = JsonPointer.get<Field>(form.fields, path);
            if (field) {
                const control = form.controls.get(field);
                if (control) control.setValue(cmd.payload.value);
            }
        }
    );
}
