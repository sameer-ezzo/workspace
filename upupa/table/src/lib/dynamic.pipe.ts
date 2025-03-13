import { Injector, Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: "dynamic",
    pure: true,
    standalone: true,
})
export class DynamicPipe implements PipeTransform {
    constructor(private injector: Injector) {}

    transform(value: any, pipeToken: any, pipeArgs: any[] = []): any {
        if (!pipeToken) {
            return value;
        } else {
            const pipe = this.injector.get(pipeToken, null, { optional: true }) as PipeTransform;
            return pipe ? pipe.transform(value, ...pipeArgs) : value;
        }
    }
}

@Pipe({
    name: "impure",
    pure: false,
    standalone: true,
})
export class NonePureDynamicPipe extends DynamicPipe {}
