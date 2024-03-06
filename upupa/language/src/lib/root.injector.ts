import { Injector, getPlatform, NgModuleRef } from "@angular/core";

export function getRootInjector(): Injector {
    const platform = getPlatform();
    const modules: NgModuleRef<any>[] = (<any>platform)._modules;
    if (modules.length > 0) {
        return modules[0].injector;
    }
    else throw "COULD NOT FIND ROOT INJECTOR";
}