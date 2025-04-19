
// import { _LISTS_INFO } from "./scheme.router.decorator";

// export function column(options: ColumnOptions = { order: 1, includeInDataSelect: true }) {
//     return function (target: any, propertyKey: string) {

//         const columns = Reflect.getMetadata('LIST_COLUMN_DESCRIPTORS', target) || _LISTS_INFO[target.constructor.name] || {};
//         const select = Reflect.getMetadata('LIST_SELECT', target) || [];
//         const text = options.header ?? toTitleCase(propertyKey);
//         options.header = text;
//         const key = options.displayPath ?? propertyKey;
//         columns[key] = options;
//         if (options.includeInDataSelect !== false) {
//             select.push(key);
//         }

//         delete options.includeInDataSelect;
//         delete options.order;


//         Reflect.defineMetadata('LIST_SELECT', select, target);
//         if (Reflect.getMetadata('design:type', target, propertyKey) === Date) {
//             if (options.pipe === undefined) {
//                 options.pipe = { pipe: DatePipe, args: ['short'] };
//             }
//         }
//         Reflect.defineMetadata('LIST_COLUMN_DESCRIPTORS', columns, target);
//         _LISTS_INFO[target.constructor.name] = { columns, select };
//     };
// }


