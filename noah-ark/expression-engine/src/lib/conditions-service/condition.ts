import { ExpressionSet } from "../evaluate-expression";
import { EventRecord } from "@noah-ark/event-bus";


export class Condition<TTrigger = any, TCommand = any> {

    name?: string;
    on: string; //event | form-value-change - submit - start - timeout ....
    when?: ExpressionSet | ((e: EventRecord<TTrigger>) => any);
    do: (TCommand | ((e: EventRecord<TTrigger>) => TCommand | void))[]; //action | change-visibility - add-error-message - set-value ....
    context?: any
}


//example:

//on form-value-change
//when: changes['age']
//do [
//      are_you_married.visibility = age >= 18
//      under18text.visibility = age < 18
//]
