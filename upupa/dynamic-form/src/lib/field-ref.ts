import { ComponentRef, computed, Injector, signal, WritableSignal } from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import { Field } from "./types";
import { createDataAdapter } from "@upupa/data";
import { cloneDeep } from "lodash";

export class FieldRef {
    readonly hidden!: WritableSignal<boolean>;
    readonly text!: WritableSignal<string | undefined>;
    readonly class!: WritableSignal<string | undefined>;
    readonly inputs!: WritableSignal<any>;
    readonly outputs!: WritableSignal<Record<string, (source: ComponentRef<any>, e: any) => void>>;
    constructor(
        readonly injector: Injector,
        readonly name: string,
        readonly path: `group:${string}` | `/${string}`,
        readonly field: Field,
        readonly form: FormGroup,
        readonly control?: FormControl | FormGroup,
    ) {
        this.hidden = signal(field.hidden === true);
        this.text = signal(field.text);
        this.class = signal(field.class);
        this.inputs = signal(this._handleInputs(field.inputs ?? {}));
        this.outputs = signal(field.outputs ?? {});
    }

    _handleInputs(_inputs: Record<string, any>) {
        const inputs = cloneDeep(_inputs);
        if (inputs["adapter"] || !inputs["_adapter"]) return inputs; //if adapter is passed don't do anything
        const adapter = createDataAdapter(inputs["_adapter"], this.injector);
        inputs["adapter"] = adapter;
        delete inputs["_adapter"];

        return inputs;
    }

    // setVisibility(visible: boolean) {
    //     const f = this.field();
    //     f.hidden = !visible;
    //     this.field.set({ ...f });
    // }
}
