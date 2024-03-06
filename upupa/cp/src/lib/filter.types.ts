export const LogicalOperator = ['and', 'or'] as const;
export type LogicalOperator = 'and' | 'or';
export const BaseOperator = ['eq', 'ne', 'isNull', 'isNotNull'] as const;
export type BaseOperator = 'eq' | 'ne' | 'isNull' | 'isNotNull';
export const StringOperator = [...BaseOperator, 'includes', 'notIncludes', 'startsWith', 'endsWith', 'reg'] as const;
export type StringOperator = BaseOperator | 'includes' | 'notIncludes' | 'startsWith' | 'endsWith' | 'reg';
export const NumberOperator = [...BaseOperator, 'gt', 'gte', 'lt', 'lte', 'between', 'notBetween'] as const;
export type NumberOperator = BaseOperator | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'notBetween';
export const ArrayOperator = [...BaseOperator, 'in', 'notIn'] as const;
export type ArrayOperator = BaseOperator | 'in' | 'notIn';


export const ALL_OPERATORS = [...LogicalOperator, ...BaseOperator, ...StringOperator, ...NumberOperator, ...ArrayOperator] as const;
export type ALL_OPERATORS = LogicalOperator | BaseOperator | StringOperator | NumberOperator | ArrayOperator;

export type FilterOperator = BaseOperator | StringOperator | NumberOperator | ArrayOperator

export type FilterValueMapper<T = any> = T
export interface FilterDescriptorMapper<T = any> {
    toPath?: (path: `/${string}`, v?: T) => string
    toValue?: (value: T) => any
}

export type FilterExpressionConditionDescriptor = Partial<{ [op in FilterOperator]: [`/${string}`] | [`/${string}`, FilterDescriptorMapper] }> &
    Partial<{ [op in LogicalOperator]: FilterExpressionConditionDescriptor[] }>

export type FilterValueDescriptor = Partial<{ [op in FilterOperator]: [`/${string}`] | [`/${string}`, FilterValueMapper] }> &
    Partial<{ [op in LogicalOperator]: FilterValueDescriptor[] }>



export type FilterExpressionDescriptor = { and: FilterExpressionConditionDescriptor[] };
export type FilterExpressionValue = { and: FilterValueDescriptor[] };


export class DefaultFilterDescriptorMapper<T> implements FilterDescriptorMapper {
    toPath(path: `/${string}`, v?: T) {
        return path.split('/').filter(p => p).join('.');
    }
    toValue(value: T) {
        return value;
    }
}
export class DefaultFilterValueMapper<T> implements FilterValueMapper {
    toValue(value: T) {
        return value;
    }
}

export function applyFilterDescriptor<T>(descriptor: FilterExpressionDescriptor, jsonData: T,
    filterDescriptorMapper: FilterDescriptorMapper<T> = new DefaultFilterDescriptorMapper<T>()
): FilterExpressionValue {
    function processFilterOperator(operator: string, path: `/${string}`, valueMapper: FilterDescriptorMapper, obj: any): any {
        if (obj === undefined || obj === null) return undefined
        const mappedValue = valueMapper.toValue(obj);
        const mappedPath = valueMapper.toPath(path, mappedValue);
        return { [operator]: [mappedPath, mappedValue] }
    };


    function processLogicalOperator(operator: LogicalOperator, conditions: [`/${string}`, FilterDescriptorMapper?][]): any {
        const r = conditions.map(processCondition).filter(c => c)
        if (r.length === 0) return undefined
        return { [operator]: r };
    }

    function processCondition(condition: any): any {
        const key = Object.keys(condition)[0];
        const value = condition[key];

        if (LogicalOperators.includes(key as LogicalOperator)) {
            return processLogicalOperator(key as LogicalOperator, value);
        } else {
            const operator = key
            const [path, desc] = value as [`/${string}`, FilterDescriptorMapper?]

            const toPath = desc?.toPath || filterDescriptorMapper.toPath
            const toValue = desc?.toValue || filterDescriptorMapper.toValue

            const objValue = getNestedValue(jsonData, path.substring(1).split('/').filter(p => p));
            return processFilterOperator(operator, path, { toPath, toValue }, objValue);
        }
    }

    
    const LogicalOperators = ['and', 'or'];
    
    let res = {} as FilterExpressionValue
    for (const [op, desc] of Object.entries(descriptor) as [LogicalOperator, any])
    res = { ...res, ...processLogicalOperator(op, desc) }

return res
}

export function getNestedValue(obj: any, pathParts: string[]): any {
    return pathParts.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}
// const obj = {
//     id: 15,
//     q: 'something must\'ve been happened',
//     owner: [{ id: 5 }, { id: 8 }]
// }
// const _filterDescriptor: FilterDescriptor = {
//     "and": [
//         { "eq": { '/id': { toPath: (key) => 'id', toValue: (v) => v } } },
//         {
//             "or": [
//                 {
//                     reg: {
//                         '/q': {
//                             toPath: (key) => {
//                                 console.log(`mapping key ${key} to assetNumber`)
//                                 return 'assetNumber'
//                             },
//                             toValue: (v) => `*${v}*`
//                         }
//                     }
//                 },
//                 {
//                     reg: {
//                         '/q': {
//                             toPath: (key) => {
//                                 console.log(`mapping key ${key} to serialNumber`)
//                                 return 'serialNumber'
//                             },
//                             toValue: (v) => `*${v}*`
//                         }
//                     }
//                 }
//             ]
//         },
//         { "in": { '/owner': { 
//             // toPath: (key) => 'owner.id', 
//             toValue: (v: any[]) => v?.map(c => c.id) } } }
//     ]
// }
// const expectedResult = {
//     "and": [
//         { "eq": { '/id': 'id' } },
//         {
//             "or": [
//                 { reg: { '/assetNumber': '*sometext*' } },
//                 { reg: { '/serialNumber': '*sometext*' } }
//             ]
//         },
//         { "in": { 'owner.id': [5, 8] } }
//     ]
// }
