import { Pipe, PipeTransform } from '@angular/core';
import { JsonPointer } from '@noah-ark/json-patch';


@Pipe({ name: 'key' })
export class KeyPipe implements PipeTransform {

    public constructor() { }

    transform(value: any, key: string): any {
        if (!value || !key) return value
        const path = key.indexOf('.') > -1 ? key.replace(/\./g, '/') : key;
        return JsonPointer.get(value, path) || ''
    }
}