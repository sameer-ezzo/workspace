import { unreachable } from "@noah-ark/common";
import { JsonPointer } from "@noah-ark/json-patch";
export const ExpressionOperatorsArray = ['gt', 'lt', 'gte', 'lte', 'eq', 'ne', 'not', 'bool', 'startsWith', 'endsWith', 'indexOf', 'equalsIgnoreCase', 'exists'] as const;
export type ExpressionOperators = typeof ExpressionOperatorsArray[number];

export type ExpressionClause = { left: string, operator: ExpressionOperators, right?: any; }
export type ExpressionSet = ExpressionClause | { clauses: (ExpressionSet)[], operator: 'and' | 'or'; }

export function evaluateExpression(expression: ExpressionSet, ctx: any) {
    let operator = expression.operator as any;
    let clauses: ExpressionSet[];
    if ('clauses' in expression) clauses = expression.clauses;
    else {
        clauses = [expression] as any[];
        operator = 'and';
    }
    const results = clauses.map((c: ExpressionClause) => evaluateClause(c, ctx));
    switch (operator) {

        case 'and': return results.reduce((a, b) => a && b);
        case 'or': return results.reduce((a, b) => a || b);
        default: {
            const o = expression.operator as any;
            if (o == '' || o == null) return results.reduce((a, b) => a && b);
            else throw `NOT_SUPPORTED_EXPRESSION_OPERATOR ${o}`;
        }
    }
}
export function evaluateClause(clause: ExpressionClause, ctx: any) {
    const left = evaluateSymbol(clause.left, ctx);
    const right = evaluateSymbol(clause.right, ctx);
    switch (clause.operator) {
        case 'eq': return left == right;
        case 'ne': return left != right;
        case 'gt': return left > right;
        case 'gte': return left >= right;
        case 'lt': return left < right;
        case 'lte': return left <= right;
        case 'not': return !left;
        case 'bool': return !!left;
        case 'exists': return left !== undefined;
        case 'startsWith': return (left + '').startsWith(right);
        case 'endsWith': return (left + '').endsWith(right);
        case 'indexOf': return (left + '').indexOf(right);
        case 'equalsIgnoreCase': return (left + '').toLowerCase() === (right + '').toLowerCase();
        default: throw unreachable('clause.operator', clause.operator)
    }
}

const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
export function isDate(value: string) {
    return dateFormat.test(value);
}

export function evaluateSymbol(symbol: any, ctx: any) {
    if (typeof symbol !== 'string') return symbol;
    const firstLetter = symbol[0];

    switch (firstLetter) {
        case '$':  //variable
            const pointer = symbol.substring(1)
            return JsonPointer.get(ctx, pointer) //  user/vip
        case '"': return symbol.substring(1, symbol.length - 1);
        case "'": return symbol.substring(1, symbol.length - 1);
        case "{": return JSON.parse(symbol);
        case "[": return JSON.parse(symbol);
    }

    switch (symbol) {
        case 'true': return true;
        case 'false': return false;
        case 'null': return null;
        case 'undefined': return undefined;
        case 'NaN': return NaN;
        case 'Infinity': return Infinity;

        default:
            const n = +symbol;
            if (isNaN(n)) {
                if (isDate(symbol)) return new Date(symbol);
                else return symbol;
            }
            else return n;
    }
}