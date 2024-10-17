import { CommonModule } from "@angular/common";
import {
    Component,
    inject,
    EnvironmentInjector,
    input,
    Type,
    ComponentRef,
    SimpleChanges,
    createComponent,
    reflectComponentType,
    ComponentMirror,
    ElementRef,
    ViewContainerRef,
    EventEmitter,
} from "@angular/core";
import { ContentNode, createContentNodes } from "./routing/with-content-projection";
import { Subscription } from "rxjs";

export type DynamicComponent = { component: Type<any>; inputs?: Record<string, any>; content?: ContentNode[][]; outputs?: Record<string, (e: any) => void>; class?: string };

@Component({
    selector: "portal",
    standalone: true,
    imports: [CommonModule],
    // host: { ngSkipHydration: "true" },
    template: ``,
})
export class PortalComponent {
    environmentInjector = inject(EnvironmentInjector);
    host = inject(ViewContainerRef);

    component = input.required<Type<any>>();
    inputs = input({});
    class = input("");
    outputs = input({});
    content = input(undefined, {
        transform: (content: ContentNode[][]) => createContentNodes(content, this.environmentInjector),
    });

    componentRef: ComponentRef<any>;
    componentMirror: ComponentMirror<any>;
    subscriptions: Subscription[] = [];

    ngOnChanges(changes: SimpleChanges) {
        if (changes["component"] || changes["content"]) {
            this.detach();
            this.attach();
        }

        if (changes["outputs"] && !changes["outputs"].firstChange) {
            this.subscribeToOutputs();
        }

        if (changes["inputs"] && !changes["inputs"].firstChange) {
            this.setInput();
        }
    }

    attach() {
        const component = this.component();
        if (!component) return;
        this.componentMirror = reflectComponentType(component);
        this.componentRef = this.host.createComponent(component, {
            environmentInjector: this.environmentInjector,
            projectableNodes: this.content(),
        });

        const c = this.class();
        if (c && this.componentRef.location) this.componentRef.location.nativeElement.classList.add(c);

        this.subscribeToOutputs();
        this.setInput();
    }

    detach() {
        this.unsubscribeToOutputs();

        if (this.componentRef) {
            this.componentRef.destroy();
            this.componentRef = undefined;
            this.componentMirror = undefined;
        }

        this.host.clear();
    }

    setInput() {
        const inputs = this.inputs() ?? {};
        for (const [key, value] of Object.entries(inputs)) {
            if (this.componentMirror.inputs.some((i) => i.templateName === key)) {
                this.componentRef.setInput(key, value);
            }
        }
        this.componentRef.changeDetectorRef.detectChanges();
    }

    subscribeToOutputs() {
        this.unsubscribeToOutputs();

        const outputs = this.outputs() ?? {};
        for (const [key, value] of Object.entries(outputs)) {
            if (this.componentMirror.outputs.some((o) => o.templateName === key)) {
                const emitter = this.componentRef.instance[key] as EventEmitter<any>;
                emitter.subscribe(value);
            }
        }
    }

    unsubscribeToOutputs() {
        if (this.subscriptions?.length) {
            this.subscriptions.forEach((s) => s.unsubscribe());
            this.subscriptions = [];
        }
    }

    ngOnDestroy() {
        this.detach();
    }
}
