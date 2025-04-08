import { ComponentRef, inject, Injectable, Injector, Provider, reflectComponentType, runInInjectionContext, provideAppInitializer, EnvironmentProviders } from "@angular/core";
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { Subscription } from "rxjs";

export function provideRouteOutputBinder(): EnvironmentProviders {
    return provideAppInitializer(() => {
        const initializerFn = ((outputBinder: RouteOutputBinder) => () => {
            const originalDeactivate = RouterOutlet.prototype.deactivate;
            const originalActivateWith = RouterOutlet.prototype.activateWith;
            RouterOutlet.prototype.activateWith = function (...args) {
                const res = originalActivateWith.apply(this, args);
                const componentRef = this.activated;
                const [activatedRoute] = args;
                outputBinder.bindOutputs(activatedRoute, componentRef);
                return res;
            };
            RouterOutlet.prototype.deactivate = function (...args) {
                const componentRef = this.activated;
                outputBinder.unbindOutputs(componentRef);
                return originalDeactivate.apply(this, args);
            };
        })(inject(RouteOutputBinder));
        return initializerFn();
    });
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
}
