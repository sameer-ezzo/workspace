import { ComponentInputs } from "./types";





export interface IFieldInputResolver {
    resolve(inputs: ComponentInputs): Promise<ComponentInputs>;
}
