import { Directive, Input, ComponentFactoryResolver, ViewContainerRef, Renderer2, OnChanges, SimpleChanges, Type, ComponentFactory, ComponentRef, SimpleChange, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormGroup, ControlValueAccessor, FormControlDirective, UntypedFormControl, AbstractControl } from '@angular/forms';

import { DynamicFormInputsMapService } from "./dynamic-form-inputsMap.service";
import { IFieldInputResolver } from './ifield-input.resolver';
import { DynamicComponentMapping } from './types/types';
import { FieldItem } from './types';


//TODO
/*
This directive is doing work that is already done properly in the FormControlDirective which is the setupControl
Currently the control is only dealing with the validators passed to it at initialization time (dynamic-component) and because of that the implmeneted internal validation is omiteed
Also the AsynValidators is not implemented properly

The hard part is the changePipeline hooks which for us we have the control property passed as input (which should not be the case)
https://github.com/angular/angular/blob/master/packages/forms/src/directives/reactive_directives/form_control_directive.ts

IMPACT:
* control property is to be removed (component should not care how is it controled via the form)
* accessor.writeValue should only write the value and not call anything related to control or change
* 
*/

@Directive({
    selector: '[dynamicField]',
    exportAs: 'dynamicField'
})
export class DynamicFieldDirective implements OnChanges, OnInit, OnDestroy {

    @Input() field: FieldItem;
    @Input() inputs: any;
    @Input() group: UntypedFormGroup;
    @Input() componentMap: DynamicComponentMapping;


    _outputs;
    _inputs;
    inlineErrors = false;

    componentRef: ComponentRef<any>;
    factory: ComponentFactory<any>;
    componentType: Type<any>;
    formControlDirective: FormControlDirective;
    control: AbstractControl;

    constructor(
        private inputsMapService: DynamicFormInputsMapService,
        private renderer: Renderer2,
        private resolver: ComponentFactoryResolver,
        private container: ViewContainerRef) { }


    ngOnChanges(changes: SimpleChanges): void {
        const { field, group, inputs } = changes;
        if (field && !field['firstChange']) this.setupField();
        if (group && !group['firstChange']) this.setupControl();
        if (inputs && !inputs['firstChange']) this.setComponentInputs(this.inputs);
    }

    ngOnDestroy(): void {
        this.componentRef?.destroy()
    }

    ngOnInit() { this.setupField(); }

    setComponentInputs(inputs: any, firstChange = false) {
        if (this._inputs === inputs) return; //don't rewrite same inputs
        this._inputs = inputs;

        const simpleChanges: SimpleChanges = {};
        let callOnChanges = false;

        let _inputs = inputs ? { ...inputs } : {};
        const inputsMap = this.inputsMapService.inputsMap
        const inputNames = Object.keys(_inputs);

        inputNames.forEach(async name => {
            const inputResolver = inputsMap[name] as IFieldInputResolver;
            if (inputResolver) {
                _inputs = await inputResolver.resolve(_inputs)
                // const resolverFunctionArgs = inputResolver.length > 1 ? inputResolver[1] : [];
                // _inputs = resolverFunction(_inputs, ...resolverFunctionArgs);
            }
        })

        for (const name in _inputs) {

            const currentValue = _inputs[name];
            if (currentValue === undefined && firstChange) continue;

            // const i = this.factory.inputs.find(x => x.templateName === name);
            // if (!i) console.log('inputs', { field: this.field.name, input: name })

            const prevValue = this.componentRef.instance[name];
            if (prevValue !== currentValue) {
                this.componentRef.instance[name] = currentValue;
                simpleChanges[name] = new SimpleChange(prevValue, currentValue, firstChange);
                callOnChanges = true;
            }
        }

        if (callOnChanges && this.componentRef.instance.ngOnChanges)
            this.componentRef.instance.ngOnChanges(simpleChanges);
    }

    setComponentOutputs(outputs: any) {
        if (this._outputs === outputs) return;
        this._outputs = outputs;


        for (let i = 0; i < this.factory.outputs.length; i++) {
            const outputInfo = this.factory.outputs[i];
            const emitter = this.componentRef.instance[outputInfo.propName] as EventEmitter<any>;;

            if (!Object.prototype.hasOwnProperty.call(outputs, outputInfo.propName)) continue;

            const currenthandler = outputs[outputInfo.propName];

            if (typeof currenthandler === 'function') emitter.subscribe(v => currenthandler(v));
            else console.error(`HANDLER FOR OUTPUT ${outputInfo.propName} is not a Function`);
        }
    }




    private setupControl() {
        if (!this.group) return console.error(`DynamicDirective didn't get group @Input() for field ${this.field?.name}`)

        this.control = this.group.controls[this.field.name];

        if (this.factory.inputs.some(i => i.templateName === 'control')) { //if component know how to handle control pass to it
            this.componentRef.instance.control = this.control;
            if (this.componentRef.instance.ngOnChanges) //call ngOnChanges if it's declared
                this.componentRef.instance.ngOnChanges({ control: new SimpleChange(undefined, this.control, true) });
        }
        else this.initFormControlDirective(this.componentRef.instance, this.control as UntypedFormControl); //else use the built-in control directive
    }

    private setupField() {

        //normalize field model
        // const componentMap = this.formService.getControl(this.field.input, this.theme);



        //create component
        this.componentType = this.componentMap.component;
        this.factory = this.resolver.resolveComponentFactory(this.componentType);

        this.componentRef = this.container.createComponent(this.factory);
        this.inlineErrors = this.componentRef.instance.inlineError === true;


        this.componentRef.instance.name = this.field.name;

        if (this.field.validations && this.factory.inputs.some(i => i.templateName === 'errorMessages')) {
            this.componentRef.instance.errorMessages = {};
            this.field.validations.forEach(v => this.componentRef.instance.errorMessages[v.name] = v.message);
        }

        this.setupControl();
        if (this.field.ui?.inputs) this.setComponentInputs(this.field.ui.inputs, true);
        if (this.field.ui?.outputs) this.setComponentOutputs(this.field.ui?.outputs)

        //ui
        setElementUiAttributes(this.renderer, this.componentRef.location.nativeElement, this.field.ui, this.field.name);
        //if (this.field.ui?.inputs) this.setComponentInputs(this.field.ui.inputs, true);
        //todo for in factory.outputs subscribe
    }

    initFormControlDirective(valueAccessor: ControlValueAccessor, control: UntypedFormControl) {

        this.formControlDirective = this.componentRef.injector.get(FormControlDirective)
        this.formControlDirective.form = control
        this.formControlDirective.ngOnChanges({ form: new SimpleChange(undefined, this.formControlDirective.form, true) })
    }


}


export function setElementUiAttributes(renderer: Renderer2, element: HTMLElement, ui: any, defaultId: string) {
    if (!renderer || !element) return;

    const _class = ui?.class;
    const _style = ui?.style;
    const _id = ui?.id || defaultId;

    if (_class) renderer.addClass(element, _class);

    if (_style?.trim().length) {
        const styles = _style.split(';')
            .filter(s => s?.trim().length)
            .map(style => {
                const parts = style.trim().split(':').filter(s => s?.trim().length);
                return { style: parts[0].trim(), value: parts[1].trim() };
            });
        styles.forEach(sitem => renderer.setStyle(element, sitem.style, sitem.value))
    }

    if (_id?.trim().length) renderer.setAttribute(element, 'id', _id);
}
