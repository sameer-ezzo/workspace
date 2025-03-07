import { Component, ComponentRef, computed, ElementRef, inject, Injector, input, model, OnChanges, output, runInInjectionContext, SimpleChanges, viewChild } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { MatStepperModule } from "@angular/material/stepper";
import { ComponentOutputsHandlers, DynamicComponent, DynamicComponentRoute, PortalComponent, provideRoute, RouteFeature, waitForOutput } from "@upupa/common";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { Route } from "@angular/router";
import { CdkStep, STEPPER_GLOBAL_OPTIONS, StepperOptions, StepperOrientation, StepperSelectionEvent } from "@angular/cdk/stepper";
import { Observable, switchMap } from "rxjs";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";

export function observeInlineSize(el: HTMLElement): Observable<number> {
    return new Observable<number>((observer) => {
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentBoxSize) {
                    const contentBoxSize = entry.contentBoxSize[0];
                    observer.next(contentBoxSize.inlineSize);
                }
            }
        });
        resizeObserver.observe(el);
        return () => resizeObserver.unobserve(el);
    });
}

export type WizardStep = {
    template: DynamicComponent | (() => DynamicComponent);
    label?: string;
    control?: AbstractControl;
    state?: string;
    editable?: boolean;
    optional?: boolean;
};

@Component({
    selector: "wizard-layout",
    standalone: true,
    templateUrl: "./wizard-layout.component.html",
    imports: [MatStepperModule, PortalComponent, CommonModule, MatButtonModule],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: {
                displayDefaultIndicatorType: false,
                showError: true,
            } as StepperOptions,
        },
    ],
})
export class WizardLayoutComponent implements OnChanges {
    stepper = viewChild("stepper", { read: ElementRef });

    injector = inject(Injector);
    steps = input.required<WizardStep[], WizardStep[]>({
        transform: (v) => {
            const value = v ?? [];
            for (const step of value) {
                const template = step.template;
                step["_template"] ??= typeof template === "function" ? runInInjectionContext(this.injector, () => template()) : template;
            }
            return v;
        },
    });

    isLinear = input(true, { transform: (v) => v ?? true });
    orientation = input<StepperOrientation, StepperOrientation>("horizontal", { transform: (v) => v ?? "horizontal" }); // preferred orientation
    tightThreshold = input<number, number>(600, { transform: (v) => v ?? 600 }); // automatically switch to vertical layout when width is less than this value

    attached = output<ComponentRef<unknown>>();
    selectedIndex = model(0);
    selected = input<CdkStep | undefined>();

    async getSelectedComponent(): Promise<ComponentRef<unknown>> {
        return this._componentRefs[this.selectedIndex()] ?? (await waitForOutput(this as WizardLayoutComponent, "attached"));
    }

    selectionChange = output<StepperSelectionEvent>();
    done = output();

    _componentRefs: ComponentRef<unknown>[] = []; // instance of each step component

    _width$ = toObservable(this.stepper).pipe(switchMap((stepper) => observeInlineSize(stepper.nativeElement)));
    _width = toSignal(this._width$);
    _tight = computed(() => (this.tightThreshold() == 0 ? false : this._width() <= this.tightThreshold()));

    onAttach({ componentRef }: { componentRef: ComponentRef<unknown> }, index: number) {
        this._componentRefs[index] = componentRef;
        this.attached.emit(componentRef);
    }

    onDetach(index: number) {
        this._componentRefs[index] = undefined;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes["steps"]) {
            this._componentRefs = this.steps().map(() => undefined);
        }
        if (changes["selectedIndex"]) {
            if (this.selectedIndex() == null || this.selectedIndex() < 0) {
                this.selectedIndex.set(0);
            }
        }
    }

    onDone() {
        this.done.emit();
    }

    onSelectedChange(e: StepperSelectionEvent) {
        this.selectionChange.emit(e);
    }

    getComponentRef(step: WizardStep);
    getComponentRef(index: number);
    getComponentRef(index: number | WizardStep) {
        const i = typeof index === "number" ? index : this.steps().indexOf(index);
        return this._componentRefs[i];
    }

    // getTemplate(step: WizardStep) {
    //     if (step["_template"]) return step["_template"];
    //     const template = step.template;
    //     const _template = typeof template === "function" ? runInInjectionContext(this.injector, () => template()) : template;
    //     step["_template"] = _template;
    //     return _template;
    // }
}

export function provideWizardLayout(
    config: Route & { steps: WizardStep[]; isLinear?: boolean; outputs?: ComponentOutputsHandlers<WizardLayoutComponent> },
    ...features: RouteFeature[]
): Route {
    return provideRoute(withWizardLayout(config), ...features);
}

export function withWizardLayout(config: Route & { steps: WizardStep[]; isLinear?: boolean; outputs?: ComponentOutputsHandlers<WizardLayoutComponent> }): DynamicComponentRoute {
    return {
        name: "withWizardLayout",
        path: config.path,
        component: {
            component: WizardLayoutComponent,
            outputs: config.outputs,
        },
        resolve: config.resolve,
        data: {
            steps: config.steps,
            isLinear: config.isLinear ?? true,
            outputs: config.outputs,
        },
    };
}

// export function withWizardStep(): WizardStep {
//     return { template: { component: DynamicComponent } };
// }
