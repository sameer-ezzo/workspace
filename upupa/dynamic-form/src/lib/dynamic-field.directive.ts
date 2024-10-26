import {
    Directive,
    Input,
    ComponentFactoryResolver,
    ViewContainerRef,
    Renderer2,
    OnChanges,
    SimpleChanges,
    Type,
    ComponentFactory,
    ComponentRef,
    SimpleChange,
    EventEmitter,
    OnInit,
    OnDestroy,
    input,
    ComponentMirror,
    effect,
    EnvironmentInjector,
    inject,
    reflectComponentType,
    ElementRef,
} from '@angular/core';
import {
    UntypedFormGroup,
    ControlValueAccessor,
    FormControlDirective,
    UntypedFormControl,
    AbstractControl,
} from '@angular/forms';

import { DynamicFormInputsMapService } from './dynamic-form-inputsMap.service';
import { IFieldInputResolver } from './ifield-input.resolver';
import { DynamicComponentMapping } from './types/types';
import { FieldItem } from './types';
import { validatorsMap } from './dynamic-form.service';

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
    exportAs: 'dynamicField',
})
export class DynamicFieldDirective implements OnChanges, OnInit, OnDestroy {
    field = input<FieldItem>();
    inputs = input<any>();
    group = input<UntypedFormGroup>();
    componentMap = input<DynamicComponentMapping>();

    _outputs;
    _inputs;
    inlineErrors = false;

    componentRef: ComponentRef<any>;
    componentType: Type<any>;
    formControlDirective: FormControlDirective;
    control: AbstractControl;

    host = inject(ViewContainerRef);
    componentMirror: ComponentMirror<any>;

    constructor(
        private inputsMapService: DynamicFormInputsMapService,
        private renderer: Renderer2
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        const { field, group, inputs } = changes;
        if (field && !field.firstChange) this.setupField();
        // if (group && !group.firstChange) this.setupControl();
        if (inputs && !inputs.firstChange)
            this.setComponentInputs(this.inputs());
    }

    ngOnDestroy(): void {
        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = undefined;
            this.componentMirror = undefined;
        }

        this.host.clear();
    }

    ngOnInit() {
        this.setupField();
    }

    setComponentInputs(inputs: any, firstChange = false) {
        if (this._inputs === inputs) return; //don't rewrite same inputs
        this._inputs = inputs;

        // const simpleChanges: SimpleChanges = {};
        // let callOnChanges = false;

        let _inputs = inputs ? { ...inputs } : {};
        const inputsMap = this.inputsMapService.inputsMap;
        const inputNames = Object.keys(_inputs);

        inputNames.forEach(async (name) => {
            const inputResolver = inputsMap[name] as IFieldInputResolver;
            if (inputResolver) {
                _inputs = await inputResolver.resolve(_inputs);
            }
        });

        for (const inputName in _inputs) {
            if (inputName === 'input') continue; //skip input property
            const currentValue = _inputs[inputName];
            if (currentValue === undefined && firstChange) continue;
            const componentInputs = this.componentMirror.inputs;
            const inputInfo = componentInputs.find(
                (i) => i.templateName === inputName
            );
            if (inputInfo) {
                try {
                    this.componentRef.setInput(inputName, currentValue);
                } catch (e) {
                    const { templateName, isSignal } = inputInfo;
                    console.error(
                        `Setting component ${
                            this.componentMirror.selector
                        }'s input ${templateName} ${
                            isSignal ? '(Signal)' : ''
                        }`,
                        e.message
                    );
                }
            } else {
                console.warn(
                    `Input ${inputName} not found in component ${this.componentMirror.selector}`
                );
            }
        }

        this.componentRef.changeDetectorRef.detectChanges();
    }

    setComponentOutputs(outputs: any) {
        if (this._outputs === outputs) return;
        this._outputs = outputs;

        for (let i = 0; i < this.componentMirror.outputs.length; i++) {
            const outputInfo = this.componentMirror.outputs[i];
            const emitter = this.componentRef.instance[
                outputInfo.propName
            ] as EventEmitter<any>;

            if (
                !Object.prototype.hasOwnProperty.call(
                    outputs,
                    outputInfo.propName
                )
            )
                continue;

            const currentHandler = outputs[outputInfo.propName];

            if (typeof currentHandler === 'function')
                emitter.subscribe((v) => currentHandler(v));
            else
                console.error(
                    `HANDLER FOR OUTPUT ${outputInfo.propName} is not a Function`
                );
        }
    }

    private setupControl() {
        if (!this.group())
            return console.error(
                `DynamicDirective didn't get group @Input() for field ${
                    this.field()?.name
                }`
            );

        this.control = this.group().controls[this.field().name];
        const { inputs, outputs } = this.field().ui ?? {};
        inputs['name'] = this.field().name;
        inputs['validators'] = (this.field().validations ?? [])
            .filter((v, i, a) => a.findIndex((x) => x.name === v.name) === i)
            .map((v) => ({
                validate: (control) => validatorsMap[v.name](v)(control),
            }));

        const controlInputInfo = this.componentMirror.inputs.find(
            (i) => i.templateName === 'control'
        );
        if (controlInputInfo) {
            inputs['control'] = this.control;
        } else
            this.initFormControlDirective(
                this.componentRef.instance,
                this.control as UntypedFormControl
            ); //else use the built-in control directive

        if (inputs) this.setComponentInputs(inputs, true);
        if (outputs) this.setComponentOutputs(outputs);

        //ui
        setElementUiAttributes(
            this.renderer,
            this.componentRef.location.nativeElement,
            this.field().ui,
            this.field().name
        );
        //if (this.field().ui?.inputs) this.setComponentInputs(this.field().ui.inputs, true);
        //todo for in factory.outputs subscribe
    }

    private setupField() {
        //normalize field model
        // const componentMap = this.formService.getControl(this.field().input, this.theme);

        //create component
        this.componentType = this.componentMap().component;
        if (!this.componentType) return;
        // this.factory = this.resolver.resolveComponentFactory(
        //     this.componentType
        // );

        this.componentMirror = reflectComponentType(this.componentType);
        this.componentRef = this.host.createComponent(this.componentType);

        this.inlineErrors = this.componentRef.instance.inlineError === true;

        this.setupControl();
    }

    initFormControlDirective(
        valueAccessor: ControlValueAccessor,
        control: UntypedFormControl
    ) {
        this.formControlDirective =
            this.componentRef.injector.get(FormControlDirective);
        this.formControlDirective.form = control;
        this.formControlDirective.ngOnChanges({
            form: new SimpleChange(
                undefined,
                this.formControlDirective.form,
                true
            ),
        });
    }
}

export function setElementUiAttributes(
    renderer: Renderer2,
    element: HTMLElement,
    ui: any,
    defaultId: string
) {
    if (!renderer || !element) return;

    const _class = ui?.class;
    const _style = ui?.style;
    const _id = ui?.id || defaultId;

    if (_class) renderer.addClass(element, _class);

    if (_style?.trim().length) {
        const styles = _style
            .split(';')
            .filter((s) => s?.trim().length)
            .map((style) => {
                const parts = style
                    .trim()
                    .split(':')
                    .filter((s) => s?.trim().length);
                return { style: parts[0].trim(), value: parts[1].trim() };
            });
        styles.forEach((sitem) =>
            renderer.setStyle(element, sitem.style, sitem.value)
        );
    }

    if (_id?.trim().length) renderer.setAttribute(element, 'id', _id);
}
