import { Injector, Pipe, PipeTransform } from '@angular/core';


@Pipe({
    name: 'dynamic',
    pure: true
})
export class DynamicPipe implements PipeTransform {

    public constructor(private injector: Injector) { }

    transform(value: any, pipeToken: any, pipeArgs: any[] = []): any {
        if (!pipeToken) {
            return value;
        }
        else {
            let pipe = this.injector.get(pipeToken);
            return pipe.transform(value, ...pipeArgs);
        }
    }
}

@Pipe({
    name: 'impure',
    pure: false
})
export class NonePureDynamicPipe extends DynamicPipe { }