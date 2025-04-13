import { ComponentRef, computed, Injector, signal, WritableSignal } from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import { Field } from "./types";
import { createDataAdapter, DataAdapter } from "@upupa/data";
import { cloneDeep } from "lodash-es";
import { DynamicComponent } from "@upupa/common";

export class FieldRef<TCom = any> {
    readonly hidden!: WritableSignal<boolean>;
    readonly text!: WritableSignal<string | undefined>;
    readonly class!: WritableSignal<string | undefined>;
    readonly inputs!: WritableSignal<DynamicComponent<TCom>["inputs"]>;
    readonly outputs!: WritableSignal<DynamicComponent<TCom>["outputs"]>;
    readonly models = new Map<string, ComponentRef<TCom>>();
    readonly attachedComponentRef = signal<ComponentRef<TCom> | undefined>(undefined);
    readonly attachedComponent = computed(() => this.attachedComponentRef()?.instance);

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

    _handleInputs(_inputs: DynamicComponent<TCom>["inputs"]) {
        const inputs = cloneDeep(_inputs);
        if (!inputs["adapter"] && !inputs["_adapter"]) return inputs; //if adapter is passed don't do anything
        if (inputs["adapter"] && inputs["adapter"] instanceof DataAdapter) return inputs; //if adapter is passed don't do anything
        if (inputs["_adapter"] && inputs["_adapter"] instanceof DataAdapter) {
            inputs["adapter"] = inputs["_adapter"];
            inputs["dataAdapter"] = inputs["_adapter"];
            delete inputs["_adapter"];
            return inputs;
        }

        const adapter = createDataAdapter(inputs["_adapter"], this.injector);
        inputs["adapter"] = adapter;
        inputs["dataAdapter"] = adapter;
        delete inputs["_adapter"];

        return inputs;
    }

    setVisibility(visible: boolean) {
        this.inputs.set({ ...this.inputs(), hidden: !visible });
        this.hidden.set(!visible);
    }
}
