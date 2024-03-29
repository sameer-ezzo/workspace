import { Condition } from "@noah-ark/expression-engine";
import { FormScheme } from "./types";



export type DynamicFormInputs<T = any> = {
    name?: string;
    preventDirtyUnload?: boolean;
    recaptcha?: string;
    theme?: string;
    initialValueFactory?: () => Promise<T>;
    scheme: FormScheme;
    conditions?: Condition[];
};
