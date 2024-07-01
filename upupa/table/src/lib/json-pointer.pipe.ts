import { Pipe, PipeTransform } from '@angular/core';
import { JsonPointer } from '@noah-ark/json-patch';


@Pipe({ name: 'jpointer' })
export class JsonPointerPipe implements PipeTransform {

    public constructor() { }

    transform(value: any, key: string): any {
        if (!value || !key) return value
        const separator = key.indexOf('.') > -1 ? '.' : '/';
        return JsonPointer.get(value, key, separator) || ''
    }
}