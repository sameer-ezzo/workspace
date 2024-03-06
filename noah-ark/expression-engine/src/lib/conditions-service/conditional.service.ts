
import { Subscription } from "rxjs";
import { Condition } from "./condition";
import { EventBusBase } from "@noah-ark/event-bus";
import { evaluateExpression, evaluateSymbol } from "../evaluate-expression";


//on (trigger) -> when (expression) -> action (do)
export abstract class ConditionalLogicServiceBase {
    private readonly conditions: Condition[] = []
    constructor(public readonly bus: EventBusBase) { }



    subs = new WeakMap<Condition, Subscription>()

    addCondition(c: Condition): Subscription {
        this.conditions.push(c);

        const sub = this.bus.on(c.on).subscribe(e => {
            let ctx = { ...c.context, event: e }

            let when: any = true

            if (c.when != null) {
                try { when = typeof c.when === 'function' ? c.when(e) : evaluateExpression(c.when, ctx); }
                catch (error) { console.error(`INVALID WHEN EXPRESSION IN CONDTION`, c.when, error); }
            }

            if (when) {
                try {
                    c.do.forEach(d => {
                        const _do = typeof d === 'function' ? d(e) : this._evaluateDoMessage(d, Object.assign({}, ctx, { when }));
                        if (_do) this.bus.emit(_do.msg, _do, e.source)
                    });
                }
                catch (error) { console.error(`INVALID DO EXPRESSION IN CONDTION`, c.do, error); }
            }
        });

        this.subs.set(c, sub);
        return sub;
    }


    removeCondition(c: Condition) {
        const i = this.conditions.indexOf(c);
        if (i < 0) return;

        this.conditions.splice(i, 1);
        const sub = this.subs.get(c);
        sub?.unsubscribe();
    }

    _evaluateDoMessage(doMessage: Record<string, any>, ctx: any): Record<string, any> {
        const result: Record<string, any> = {};
        for (const key in doMessage) {
            const variable = doMessage[key];
            if (typeof variable === 'object') //variable is an expression
                result[key] = evaluateExpression(variable, ctx);
            else result[key] = evaluateSymbol(variable, ctx);
        }
        return result;
    }
}
