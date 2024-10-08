import { CommonModule, DOCUMENT } from "@angular/common";
import { Component, inject, EnvironmentInjector, Input, Type, input, createComponent, ComponentRef } from "@angular/core";
import { RouteFeature } from "./route-feature";

@Component({
    standalone: true,
    imports: [CommonModule],
    template: ` <ng-container *ngComponentOutlet="component(); inputs: inputs(); content: content()"></ng-container> `,
})
export class WrapperComponent {
    document = inject(DOCUMENT);
    injector = inject(EnvironmentInjector);
    component = input.required<Type<any>>();
    inputs = input({});
    content = input(undefined, {
        transform: (content: (string | Type<any> | { component: Type<any>; inputs: Record<string, any> })[][]) => {
            if (!content) return undefined;
            return content.map((c) =>
                c.map((c) => {
                    if (typeof c === "string") {
                        const div = document.createElement("div");
                        div.innerHTML = c;
                        return div;
                    }

                    let componentRef: ComponentRef<any>;
                    if ("component" in c) {
                        componentRef = createComponent(c.component, { environmentInjector: this.injector });
                        for (const [key, value] of Object.entries(c.inputs)) {
                            componentRef.setInput(key, value);
                        }
                    } else componentRef = createComponent(c, { environmentInjector: this.injector });
                    componentRef.changeDetectorRef.detectChanges();
                    return componentRef.location.nativeElement;
                }),
            );
        },
    });
}

export function withContentProjection(config: { content: (Type<any> | string | { component: Type<any>; inputs: Record<string, any> })[][] }): RouteFeature {
    return (route) => ({
        component: WrapperComponent,
        data: {
            component: route.component,
            content: config.content,
        },
    });
}
