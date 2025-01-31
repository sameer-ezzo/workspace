import { Condition } from '@noah-ark/expression-engine';
import { Field, FormScheme } from './types';

export type DynamicFormInputs<T = any> = {
    name?: string;
    class?: string;
    preventDirtyUnload?: boolean;
    recaptcha?: string;
    theme?: string;
    fields?: FormScheme | Map<string, Field>;
    conditions?: Condition[];
};
