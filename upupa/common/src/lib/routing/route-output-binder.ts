import { ComponentRef, inject, Injectable, Injector, Provider, reflectComponentType, runInInjectionContext, provideAppInitializer, EnvironmentProviders } from "@angular/core";
import { ActivatedRoute, Router, RouterOutlet } from "@angular/router";
import { Subscription } from "rxjs";

export function provideRouteOutputBinder(): EnvironmentProviders {
    return provideAppInitializer(() => {
        const outputBinder = inject(RouteOutputBinder);
        const originalActivateWith = RouterOutlet.prototype.activateWith;
        const originalDeactivate = RouterOutlet.prototype.deactivate;

        RouterOutlet.prototype.activateWith = function (activatedRoute, ...args) {
            const res = originalActivateWith.call(this, activatedRoute, ...args);
            outputBinder.bindOutputs(activatedRoute, this.activated);
            return res;
        };

        RouterOutlet.prototype.deactivate = function (...args) {
            outputBinder.unbindOutputs(this.activated);
            return originalDeactivate.apply(this, args);
        };
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
