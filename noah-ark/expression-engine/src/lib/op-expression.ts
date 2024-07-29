
const UNARY_OPERATORS = ['negate'] as const
export type UnaryOperators = typeof UNARY_OPERATORS[number]

const BINARY_OPERATORS = ['gt', 'lt', 'eq', 'in'] as const
export type BinaryOperators = typeof BINARY_OPERATORS[number]


const POLY_OPERATORS = ['and', 'or', 'sum', 'mul', 'sub', 'div'] as const
export type PolyOperators = typeof POLY_OPERATORS[number]

const ALL_OPERATORS = [...POLY_OPERATORS, ...BINARY_OPERATORS, ...UNARY_OPERATORS]
const ALL_POLY_OPERATORS = [...POLY_OPERATORS, ...BINARY_OPERATORS, ...UNARY_OPERATORS]


export type ExpressionSymbol = string | number | boolean | null | undefined | object

export type UnaryExpression = { [op in UnaryOperators as `$${op}`]: Expression }
export type BinaryExpression = { [op in BinaryOperators as `$${op}`]: [Expression, Expression] }
export type PolyExpression = { [op in PolyOperators as `$${op}`]: Expression[] }

export type Expression = ExpressionSymbol | UnaryExpression | BinaryExpression | PolyExpression

function extractValue<T = any>(ctx: Record<string, unknown>, path: string): T {
    const segments = path.split('/').filter(c => c.trim().length)
    let value = null
    for (const s of segments) value = ctx[s]
    return value as T
}

export const hasExpressionOperatorKey = (exp: Expression) => Object.getOwnPropertyNames(exp)[0].startsWith('$')
export const isSymbolExp = (exp: Expression) => typeof exp !== 'object' || !hasExpressionOperatorKey(exp)

export const getOperatorType = (key: any): [string, ('unary' | 'binary' | 'poly' | undefined)] => {
    if (key.startsWith('$')) key = key.substring(1)
    if (UNARY_OPERATORS.includes(key)) return [key, 'unary']
    else if (BINARY_OPERATORS.includes(key)) return [key, 'binary']
    else if (POLY_OPERATORS.includes(key)) return [key, 'poly']
    return [key, undefined]
}
export function evaluateOpExpression(exp: Expression, ctx: any) {
    if (exp === null || exp === undefined) return exp
    if (isSymbolExp(exp)) return exp
    const res = []
    const noneSymbolExp = exp as UnaryExpression | BinaryExpression | PolyExpression

    for (const op in noneSymbolExp) {
        let k = op as any
        const t = (Array.isArray(noneSymbolExp[op]) ? noneSymbolExp[op] : [noneSymbolExp[op]]).map(e => evaluateOpExpression(e, ctx)).reduce((a, b) => {
          if (Array.isArray(a) && Array.isArray(b)) {
            return a.concat(b);
          } else if (Array.isArray(a)) {
            return a.concat([b]);
          } else if (Array.isArray(b)) {
            return [a].concat(b);
          } else {
            return [a, b];
          }
        }, []);

        let expRes = null
        if (k.startsWith('$')) k = op.substring(1)

        if (UNARY_OPERATORS.includes(k)) expRes = evalUnaryExpression(k, Array.isArray(t) ? t.shift() : t, ctx)
        else if (BINARY_OPERATORS.includes(k)) expRes = evalBinaryExpression(k, t, ctx)
        else if (POLY_OPERATORS.includes(k)) expRes = evalPolyExpression(k, [t], ctx)
        else console.warn(`Non supported operator ${k}.`)

        res.push(expRes)
    }

    return res
}



export function evalUnaryExpression(op: string, exp: ExpressionSymbol, ctx: any): any {
    switch (op) {
        case 'negate': return !evalExpressionSymbol(op, exp, ctx)
        default:
            console.warn(op, ' not supported')
            return null
    }
}
export function evalBinaryExpression(op: string, exp: [ExpressionSymbol, ExpressionSymbol] | Expression, ctx: any) {
    if (!Array.isArray(exp)) {
        console.warn('Invalid expression format for binary operator:', op);
        return null;
    }

    switch (op) {
        case 'gt': return exp.reduce((a, b) => a > b)
        case 'gte': return exp.reduce((a, b) => a >= b)
        case 'lt': return exp.reduce((a, b) => a < b)
        case 'lte': return exp.reduce((a, b) => a <= b)
        case 'in': return (exp[0] as []).some(l => (exp[1] as []).indexOf(l) > -1)
        default:
            console.warn(op, ' not supported')
            return null
    }
}
export function evalPolyExpression(op: string, exp: any[], ctx: any) {
    let res = null
    switch (op) {
        case 'sum':
            res = exp.reduce((a, b) => a + b, 0)
            break
        case 'sub':
            res = exp.reduce((a, b) => a - b)
            break
        case 'mul':
            res = exp.reduce((a, b) => a * b, 1)
            break
        case 'div':
            res = exp.reduce((a, b) => a / b)
            break
        default:
            console.warn(op, ' not supported')
            return res
    }
    return res
}
export function evalExpressionSymbol(op: string, exp: ExpressionSymbol, ctx: any) {
    if (typeof exp === 'string' && exp.startsWith('/')) return extractValue(ctx, exp)
    else return exp
}

