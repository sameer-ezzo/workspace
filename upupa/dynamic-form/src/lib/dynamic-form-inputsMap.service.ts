import { Injectable, Injector } from '@angular/core';
import { AdapterInputResolverService } from './adapter-input-resolver.service';
import { IFieldInputResolver } from './ifield-input.resolver';



@Injectable({
    providedIn: 'root'
})
export class DynamicFormInputsMapService {
    readonly inputsMap: { [type: string]: IFieldInputResolver; }
    constructor(public readonly injector: Injector) {
        this.inputsMap = {
            //  [(inputs: ComponentInputs, ...args: any[]) => ComponentInputs, any[]] } = {
            _adapter: this.injector.get(AdapterInputResolverService), // [_adapter, [this.ds, this.http]] // returns function and array of ordered arguments to be passed to this function
        }
    };
}
