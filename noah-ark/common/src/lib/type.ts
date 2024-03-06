export interface Type<T = any> extends Function {
    new(...args: unknown[]): T;
}