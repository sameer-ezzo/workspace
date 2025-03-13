import { APP_INITIALIZER, ComponentRef, inject, Injectable, Injector, Provider, reflectComponentType, runInInjectionContext } from "@angular/core";
import { SIGNAL } from "@angular/core/primitives/signals";
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { Subscription } from "rxjs";

function isClass(func) {
    return typeof func === "function" && func.prototype?.constructor !== undefined;
}

function isSignal(func) {
    return typeof func === "function" && func[SIGNAL];
}

export function provideRouteOutputBinder(): Provider {
    return {
        provide: APP_INITIALIZER,
        useFactory: (outputBinder: RouteOutputBinder) => () => {
            const originalDeactivate = RouterOutlet.prototype.deactivate;
            const originalActivateWith = RouterOutlet.prototype.activateWith;
            RouterOutlet.prototype.activateWith = function (...args) {
                const res = originalActivateWith.apply(this, args);
                const componentRef = this.activated;
                const [activatedRoute] = args;
                outputBinder.setInputs(activatedRoute, componentRef);
                outputBinder.bindOutputs(activatedRoute, componentRef);
                return res;
            };
            RouterOutlet.prototype.deactivate = function (...args) {
                const componentRef = this.activated;
                outputBinder.unbindOutputs(componentRef);
                return originalDeactivate.apply(this, args);
            };
        },
        deps: [RouteOutputBinder],
        multi: true,
    };
}

@Injectable({ providedIn: "root" })
export class RouteOutputBinder {
    _map = new Map<ComponentRef<any>, Subscription[]>();

    injector = inject(Injector);

    bindOutputs(activatedRoute: ActivatedRoute, componentRef: ComponentRef<any>): void {
        if (!componentRef) return;

        const outputsConfig = activatedRoute.snapshot.data["outputs"] as Record<string, (...args: any[]) => void>;
        const mirror = reflectComponentType(componentRef.componentType);
        if (outputsConfig) {
            for (const outputName in outputsConfig) {
                if (!mirror.outputs.find((o) => o.propName == outputName)) continue;

                const output = componentRef.instance[outputName];
                if (output && output.subscribe) {
                    const handler = outputsConfig[outputName];
                    const subscription = output.subscribe((...args: any[]) => {
                        runInInjectionContext(componentRef.injector, () => {
                            handler(componentRef, ...args);
                        });
                    });
                    this._map.set(componentRef, [...(this._map.get(componentRef) || []), subscription]);
                }
            }
        }
    }

    unbindOutputs(componentRef: ComponentRef<any>) {
        if (!componentRef) return;
        if (this._map.has(componentRef)) {
            for (const sub of this._map.get(componentRef)) {
                sub.unsubscribe();
            }
            this._map.delete(componentRef);
        }
    }

    setInputs(activatedRoute: ActivatedRoute, componentRef: ComponentRef<any>): void {
        if (!componentRef) return;

        const { queryParams, params, data } = activatedRoute.snapshot;
        const inputs = { ...queryParams, ...params, ...data };
        const mirror = reflectComponentType(componentRef.componentType);

        for (const input of mirror.inputs) {
            if (input.propName in inputs) {
                const inputValue = this._getInputValue(inputs[input.propName]);
                componentRef.setInput(input.propName, inputValue);
            }
        }
    }

    _getInputValue(inputValue: any) {
        if (typeof inputValue == "function" && !isClass(inputValue) && !isSignal(inputValue)) {
            console.log("Running input function", inputValue);
            return runInInjectionContext(this.injector, () => inputValue());
        }
        return inputValue;
    }
}
