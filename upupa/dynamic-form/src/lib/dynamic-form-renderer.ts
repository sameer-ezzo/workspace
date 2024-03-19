import { Renderer2 } from "@angular/core";
import { AbstractControl, UntypedFormBuilder, ValidatorFn, UntypedFormGroup, UntypedFormControl } from "@angular/forms";
import { EventBus, DialogService } from "@upupa/common";
import { Subject, Subscription, debounceTime, filter, firstValueFrom } from "rxjs";
import { _mergeFields } from "./dynamic-form.helper";
import { DynamicFormService } from "./dynamic-form.service";
import { Field, Fieldset, FieldItem, ValidationTask, Validator } from "./types";
import { TaskValidationComponent } from "./task.validation.component/task.validation.component";
import { DynamicFormEvents as DF_Events } from "./events/events";

export class DynamicFormRenderer<T = any> {

    _lockChange = 0;
    value$ = new Subject<T>();
    _value: T;

    lot_number = 0; //to mark controls as they are created
    form = null;
    controls = new Map<Field, UntypedFormControl>();

    validationTasks: { [field: string]: ValidationTask; } = {};


    _fields: Field[];
    _sub: Subscription;

    constructor(
        private formService: DynamicFormService,
        public defaultTheme: string,
        public bus: EventBus,
        public fb: UntypedFormBuilder,
        public dialog: DialogService,
        public parent: any,
        public renderer: Renderer2
    ) {
        this.form = this.fb.group({});
    }

    private get theme() { return this.parent?.theme ?? this.defaultTheme }

    getValidator(validator: Validator): ValidatorFn {
        const validatorFactory = this.formService.getValidatorFactory(validator.name)
        if (validatorFactory) return validatorFactory(validator);
        else throw "INVALID_VALIDATOR: " + validator.name;
    }


    get fields(): Field[] { return this._fields; }
    set fields(val: Field[]) {
        this._fields = val;
        this._onFieldsChange();
    }

    private _onFieldsChange() {
        if (this.fields) {

            this.lot_number++;
            this.processFields(this.fields, this.form, '', this.value);

            const abandonedControls = Array.from(this.controls).filter(([_, c]) => c['lot_number'] != this.lot_number);
            abandonedControls.forEach(([field, control]) => {
                const formGroup = control.parent as UntypedFormGroup
                if (formGroup && control === formGroup.controls[field.name]) { //double checking on control because removing is by name 
                    formGroup.removeControl(field.name);
                }
                this.controls.delete(field);
            });

        }
        else throw 'scheme must be provided with at least one field.';

        if (this._sub) this._sub.unsubscribe();
        this._sub = this.form.valueChanges.pipe(debounceTime(50)).subscribe(v => {
            if (this._lockChange > 0) return;
            let value = Object.assign({}, this.value ?? {}, v);
            this._value = value;
            this.value$.next(value);
        });

        this.writeValue(this._value);
    }

    processFields(scheme: Field[], form: UntypedFormGroup, path: string, value?: any) {
        for (const fieldName in scheme) {
            const field = scheme[fieldName];
            if (field.type === 'fieldset') this.processFieldset(<Fieldset>field, form, path, value?.[field.name]);
            else this.processFieldItem(<FieldItem>field, form, path, value?.[field.name]);
        }
    }

    processFieldset(fieldset: Fieldset, form: UntypedFormGroup, path: string, value?: any): void {
        let nestedForm = form.controls[fieldset.name] as UntypedFormGroup;
        if (!nestedForm) {
            nestedForm = this.fb.group({});
            form.addControl(fieldset.name, nestedForm);
        }
        this.processFields(Object.values(fieldset.items), nestedForm, `${path}/${fieldset.name}`, value);
    }

    processFieldItem(field: FieldItem, form: UntypedFormGroup, path: string, value: any): void {
        let control = this.controls.get(field);
        if (!control) {
            const componentMap = this.formService.getControl(field.input, this.theme);
            if (componentMap.field) _mergeFields(field, componentMap.field);
            field['path'] = `${path}/${field.name}`;

            control = this.fb.control(undefined);
            control.valueChanges
                .subscribe(v => this.bus.emit(DF_Events.valueChanged, { msg: DF_Events.valueChanged, fields: field.path, value: v }, this.parent));

            control.setValue(value, { emitEvent: false, onlySelf: true });
            const validators = this.getValidators(field);
            control.addValidators(validators);
            control.markAsPristine();
            control.markAsUntouched();

            this.controls.set(field, control);
            if (form.controls[field.name]) form.removeControl(field.name);
            form.addControl(field.name, control);

            if (field.validationTask) {
                this.setupValidationTask(field, control);
            }
        }

        control['lot_number'] = this.lot_number;
    }


    private getValidators(field: Field) {
        const validations = field.validations || [];
        return validations.map(v => this.getValidator(v));
    }

    private setupValidationTask(field: FieldItem, control: AbstractControl) {
        const task = field.validationTask;
        this.validationTasks[field.name] = task;

        const validator = control.validator;
        control.setValidators(control => {
            if (!control) return undefined

            let errors = validator ? validator(control) : null;
            if (errors === null && task.state != 'check') { //if normal validators are happy and task still didn't sccuceed then show validation-task error  
                errors = {};
                errors[task.name || 'validation-task'] = { msg: task.error, validationTask: true };
            }
            return errors;
        });

        control.valueChanges.subscribe(() => {
            task.state = task.state === 'send' ? 'send' : 'error';
            task.token = null;
            if (task.confirm)
                task.state = task.confirm.state = 'vpn_key';
            const errorCodes = Object.keys(control.errors || {});
            task.disabled = !(errorCodes.length === 1 && control.errors[errorCodes[0]].validationTask);
        });

        control.valueChanges.pipe(filter(value => value != null), debounceTime(5000)).subscribe(() => {
            if (!task.disabled && task.state === 'send') {
                control.markAsTouched();
                this.runValidationTask(field);
            }
        });
    }

    async runValidationTask(field: FieldItem) {
        const task = this.validationTasks[field.name];
        const control = this.form[field.name];

        if (task.disabled || task.state === 'check')
            return;

        if (task.confirm) {
            const token = await this.openValidationTaskDialog(field);
            task.confirm = null;
            if (token)
                task.token = token;
            return;
        }
        task.state = 'error';

        try {
            const result = await task.task(field.name, control.value);
            if (result === null || result === true)
                task.state = 'check';
            else if (result['code']) {
                task.state = 'vpn_key';
                task.confirm = result['code'];
                task.confirm.state = 'vpn_key';
            }
            else {
                task.error = result;
                task.state = 'error';
            }
        }
        catch (error) { task.state = 'error'; }

        control.updateValueAndValidity({ emitEvent: false });
    }

    openValidationTaskDialog(field: FieldItem) {
        const task = this.validationTasks[field.name];
        const control = this.controls.get(field);
        return firstValueFrom(this.dialog.openDialog(TaskValidationComponent, { data: { field, task, control } })
            .afterClosed());
    }

    get value() { return this._value; }
    set value(val: any) { this.writeValue(val); }

    writeValue(val: any) {
        this._lockChange++;
        this._value = val;

        try {
            if (this.fields) {
                for (const f of this.fields) {
                    const v = val ? val[f.name] : undefined;
                    if (v === undefined) continue;
                    if (f.type === 'fieldset') this._writeOnFieldset(f, this.form, v);
                    else {
                        this._writeOnControl(f, v)
                    }
                }
            }
        }
        catch (error) { console.error(error); }
        finally { this._lockChange--; }
    }

    _writeOnFieldset(fieldset: Fieldset, form: any, val: any) {
        const group = form[fieldset.name]
        for (const name in fieldset.items) {
            const f = fieldset.items[name];
            const v = val ? val[f.name] : undefined;
            if (v === undefined) continue;

            if (f.type === 'fieldset') this._writeOnFieldset(f, group, v);
            else this._writeOnControl(f, v)
        }
    }

    _writeOnControl(f: Field, v: any) {
        const c = this.controls.get(f);
        if (c?.value !== v) {
            c?.setValue(v);
            this.bus.emit(DF_Events.valueChanged, { msg: DF_Events.valueChanged, fields: f.path, value: v }, this.parent)
        }
    }


    destroy() { }
}