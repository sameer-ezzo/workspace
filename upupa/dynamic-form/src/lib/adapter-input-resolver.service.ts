import { inject, Injectable, Injector } from '@angular/core';
import { createDataAdapter } from '@upupa/data';

import { IFieldInputResolver } from './ifield-input.resolver';
import { ComponentInputs } from './types';

@Injectable({
    providedIn: 'root',
})
export class AdapterInputResolverService implements IFieldInputResolver {
    private injector = inject(Injector);
    resolve(inputs: ComponentInputs): Promise<ComponentInputs> {
        if (inputs['adapter'] || !inputs['_adapter']) return Promise.resolve(inputs); //if adapter is passed don't do anything

        const adapter = createDataAdapter(inputs['_adapter'], this.injector);
        inputs['adapter'] = adapter;
        delete inputs['_adapter'];
        return Promise.resolve(inputs);
    }
}
