import {
    Component,
    EnvironmentInjector,
    Type,
    ComponentRef,
    SimpleChanges,
    reflectComponentType,
    ComponentMirror,
    ViewContainerRef,
    EventEmitter,
    Injector,
    inject,
    input,
    output,
    EffectRef,
    runInInjectionContext,
    effect,
    signal,
    viewChild,
} from "@angular/core";
import { Subscription } from "rxjs";
import { createContentNodes } from "./routing/create-content-nodes";
import { ContentNode } from "./routing/content-node";
import { DynamicComponent } from "./dynamic-component";
import { signalLink } from "./routing/signals";

@Component({
    selector: "portal",
    imports: [],
    template: ` <ng-container #portal></ng-container> `,
})
export class PortalComponent<TCom = any> {
    environmentInjector = inject(EnvironmentInjector);
    // host = inject(ViewContainerRef);
    portal = viewChild("portal", { read: ViewContainerRef });
    componentRef?: ComponentRef<any>;
    componentMirror?: ComponentMirror<any>;

    template = input<DynamicComponent<TCom>>();

    component = input<Type<TCom>>();
    class = input<string>();
    inputs = input<DynamicComponent<TCom>["inputs"]>();
    outputs = input<DynamicComponent<TCom>["outputs"]>();
    bindings = input<DynamicComponent<TCom>["bindings"]>();
    content = input<ContentNode[][]>(undefined);
    injector = input<Injector>();
    _injector = inject(Injector);

    attached = output<{ componentRef: ComponentRef<any>; componentMirror: ComponentMirror<any> }>();
    detached = output<{ componentRef: ComponentRef<any>; componentMirror: ComponentMirror<any> }>();

    _bindingRefs: EffectRef[] = [];
    _outputSubs: Subscription[] = [];

    ngOnChanges(changes: SimpleChanges) {
        const _template = this.template();
        const _component = this.component();
        if (_template && _component) throw new Error("You must provide either template or component but not both");
        if (!_template && !_component) throw new Error("You must provide either template or component");

        const template: DynamicComponent<TCom> = {
            component: _component ?? _template?.component,
            inputs: this.inputs() ?? _template?.inputs,
            content: this.content() ?? _template?.content,
            outputs: this.outputs() ?? _template?.outputs,
            class: this.class() ?? _template?.class,
            injector: this.injector() ?? _template?.injector ?? this._injector,
            bindings: this.bindings() ?? _template?.bindings,
        };

        if (changes["component"] || changes["content"] || changes["template"]) {
            const previousComponent = this.componentRef?.instance?.constructor;
            // only detach if the component type has changed
            if (previousComponent !== template.component) {
                this.detach();
                this.attach(template);
            } else {
                this.setInputs(template.inputs ?? {});
                this.subscribeToOutputs(template.outputs ?? {});
            }
        }

        if (changes["outputs"] && !changes["outputs"].firstChange) {
            this.subscribeToOutputs(template.outputs ?? {});
        }

        if (changes["inputs"] && !changes["inputs"].firstChange) {
            this.setInputs(template.inputs ?? {});
        }

        if (changes["bindings"] && !changes["bindings"].firstChange) {
            this.applyBindings(template.bindings ?? {});
        }
    }

    applyBindings(bindings: DynamicComponent["bindings"]) {
        this.removeBindings();
        runInInjectionContext(this.injector(), () => {
            for (const [key, _externalSignal] of Object.entries(bindings ?? {})) {
                const internalSignal = this.componentRef.instance[key];
                const externalSignal = () => _externalSignal.call(this.componentRef.instance);
                if ("set" in internalSignal) {
                    // model signal

                    const effectRef = signalLink(externalSignal, internalSignal);
                    this._bindingRefs.push(effectRef);
                } else {
                    // input signal
                    this.componentRef.setInput(key, externalSignal());
                    const inputWrapper = signal(internalSignal());
                    const ref = effect(() => {
                        const value = inputWrapper();
                        this.componentRef.setInput(key, value);
                    });
                    const effectRef = signalLink(
                        () => externalSignal.call(this.componentRef.instance),
                        () => inputWrapper.call(this.componentRef.instance),
                    );
                    this._bindingRefs.push(effectRef);
                    this._bindingRefs.push(ref);
                }
            }
        });
    }

    removeBindings() {
        for (const effectRef of this._bindingRefs) {
            effectRef.destroy();
        }
    }

    attach(template: DynamicComponent) {
        const component = template.component;
        if (!component) return;
        const content = createContentNodes(template.content, this.environmentInjector);
        this.componentMirror = reflectComponentType(component) ?? undefined;
        this.componentRef = this.portal().createComponent(component, {
            environmentInjector: this.environmentInjector,
            projectableNodes: content,
            injector: template.injector,
        });

        try {
            const cssClass = (template.class ?? "").split(" ").filter(Boolean);
            if (cssClass.length && this.componentRef.location) this.componentRef.location.nativeElement.classList.add(...cssClass);

            this.subscribeToOutputs(template.outputs ?? {});
            this.setInputs(template.inputs ?? {});
            // this.applyBindings(template.bindings ?? {});
        } catch (error) {
            console.error(`Error during component ${template.component.name} attach:`, error);
        }

        this.attached.emit({ componentRef: this.componentRef, componentMirror: this.componentMirror });
    }

    detach() {
        this.unsubscribeOutputs();

        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = undefined;
            this.componentMirror = undefined;
        }

        this.portal().clear();

        this.detached.emit({ componentRef: this.componentRef, componentMirror: this.componentMirror });
    }

    setInputs(inputs: Record<string, any>) {
        for (const [key, value] of Object.entries(inputs)) {
            if (this.componentMirror.inputs.some((i) => i.templateName === key)) {
                try {
                    this.componentRef.setInput(key, value);
                } catch (error) {
                    console.error("Error setting input:", this.componentRef.instance.constructor.name, key, value);
                }
            }
        }
        this.componentRef?.changeDetectorRef?.detectChanges();
    }

    subscribeToOutputs(outputs: Record<string, (source: ComponentRef<any>, e: any) => void | Promise<void>>) {
        this.unsubscribeOutputs();

        for (const [key, handler] of Object.entries(outputs)) {
            if (this.componentMirror.outputs.some((o) => o.templateName === key)) {
                const emitter = this.componentRef.instance[key] as EventEmitter<any>;
                emitter.subscribe((e) => handler(this.componentRef, e));
            }
        }
    }

    unsubscribeOutputs() {
        if (this._outputSubs?.length) {
            this._outputSubs.forEach((s) => s.unsubscribe());
            this._outputSubs = [];
        }
    }

    ngOnDestroy() {
        this.detach();
    }
}
