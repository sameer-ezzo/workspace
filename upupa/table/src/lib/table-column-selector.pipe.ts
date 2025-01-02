import { Pipe, PipeTransform } from "@angular/core";




@Pipe({
    name: 'table-col-selector',
    standalone: true,
})
export class TableColumnSelectorPipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        return args?.length > 0 ? value?.[args[0]] ?? '' : '';
    }
}
