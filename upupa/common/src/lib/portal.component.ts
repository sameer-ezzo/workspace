import { CommonModule } from "@angular/common";
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
    ModelSignal,
    runInInjectionContext,
} from "@angular/core";
import { Subscription } from "rxjs";
import { createContentNodes } from "./routing/create-content-nodes";
import { ContentNode } from "./routing/content-node";
import { DynamicComponent } from "./dynamic-component";
import { signalLink } from "./routing/signals";

@Component({
    selector: "portal",
    imports: [CommonModule],
    // host: { ngSkipHydration: "true" },
    template: ``,
    standalone: true,
})
export class PortalComponent<TCom = any> {
    environmentInjector = inject(EnvironmentInjector);
    host = inject(ViewContainerRef);

    componentRef?: ComponentRef<any>;
    componentMirror?: ComponentMirror<any>;

    template = input<DynamicComponent<TCom>>();

    component = input<Type<TCom>>();
    class = input<string>();
    inputs = input<DynamicComponent<TCom>["inputs"]>();
    outputs = input<DynamicComponent<TCom>["outputs"]>();
    models = input<DynamicComponent<TCom>["models"]>();
    content = input<ContentNode[][]>(undefined);
    injector = input<Injector>(this.host.injector);

    attached = output<{ componentRef: ComponentRef<any>; componentMirror: ComponentMirror<any> }>();
    detached = output<{ componentRef: ComponentRef<any>; componentMirror: ComponentMirror<any> }>();

    _modelEffectRefs: EffectRef[] = [];
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
            injector: this.injector() ?? _template?.injector,
            models: this.models() ?? _template?.models,
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

        if (changes["models"] && !changes["models"].firstChange) {
            this.subscribeToModel(template.models ?? {});
        }
    }

    subscribeToModel(models: DynamicComponent["models"]) {
        this.unsubscribeModel();
        runInInjectionContext(this.injector(), () => {
            for (const [key, model] of Object.entries(models ?? {})) {
                const componentModel = this.componentRef.instance[key] as ModelSignal<any>;
                if ("set" in componentModel) {
                    const effectRef = signalLink(model, componentModel);
                    this._modelEffectRefs.push(effectRef);
                }
            }
        });
    }

    unsubscribeModel() {
        for (const effectRef of this._modelEffectRefs) {
            effectRef.destroy();
        }
    }

    attach(template: DynamicComponent) {
        const component = template.component;
        if (!component) return;
        const content = createContentNodes(template.content, this.environmentInjector);
        this.componentMirror = reflectComponentType(component) ?? undefined;
        this.componentRef = this.host.createComponent(component, {
            environmentInjector: this.environmentInjector,
            projectableNodes: content,
            injector: template.injector,
        });

        const cssClass = template.class;
        if (cssClass && this.componentRef.location) this.componentRef.location.nativeElement.classList.add(cssClass);

        this.subscribeToOutputs(template.outputs ?? {});
        this.setInputs(template.inputs ?? {});
        this.subscribeToModel(template.models ?? {});

        this.attached.emit({ componentRef: this.componentRef, componentMirror: this.componentMirror });
    }

    detach() {
        this.unsubscribeOutputs();

        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = undefined;
            this.componentMirror = undefined;
        }

        this.host.clear();

        this.detached.emit({ componentRef: this.componentRef, componentMirror: this.componentMirror });
    }

    setInputs(inputs: Record<string, any>) {
        for (const [key, value] of Object.entries(inputs)) {
            if (this.componentMirror.inputs.some((i) => i.templateName === key)) {
                this.componentRef.setInput(key, value);
            }
        }
        this.componentRef.changeDetectorRef.detectChanges();
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
