import { Inject, Injectable, Type, inject } from "@angular/core";
import { ValidatorFn } from "@angular/forms";

import { FieldItem, Validator } from "./types";
import { _mergeFields } from "./dynamic-form.helper";
import { DEFAULT_THEME_NAME, DYNAMIC_COMPONENT_MAPPER, DYNAMIC_FORM_OPTIONS } from "./di.token";
import { DynamicFormOptions } from "./dynamic-form.options";
import { DynamicComponentMapper, DynamicComponentMapping } from "./types/types";
import { BaseTextInputComponent } from "@upupa/common";

@Injectable({
  providedIn: "root",
})
export class DynamicFormService {


  public options = inject(DYNAMIC_FORM_OPTIONS) as DynamicFormOptions
  public defaultThemeName = inject(DEFAULT_THEME_NAME) as string
  private componentMapper = inject(DYNAMIC_COMPONENT_MAPPER) as DynamicComponentMapper

  getControl(type: string = "text", theme: string = this.defaultThemeName): DynamicComponentMapping {
    const result = this.componentMapper[theme][type]

    if (result) return result;
    if (this.options.enableLogs === true) {
      const text = `Dynamic Service: UnrecognizedType: ${type} in theme: ${theme}`
      console.warn(text)
    }

    return {
      component: BaseTextInputComponent,
      // field: { ui: { inputs: { header: "Missing Component Type" } } },
    };

  }

  addControlType(type: string, component: Type<any>, theme: string, field?: FieldItem) {
    this.componentMapper[theme][type] = { component, field };
  }
  getValidatorFactory(name: string): (control) => ValidatorFn {
    return validatorsMap[name] as (control) => ValidatorFn;
  }
}

const validatorsMap: { [name: string]: (validator: Validator) => ValidatorFn } = {
  required: (v) => (control) => {

    const res = empty(control) ? { [v.message || "required"]: true } : null

    return res
  },
  requiredTrue: (v) => (control) =>
    control?.value !== true
      ? { [v.message || "required"]: true }
      : null,
  pattern: (v) => (control) =>
    empty(control) || new RegExp(<string>v.arguments).test(control.value)
      ? null
      : { [v.message || "pattern-error"]: true},
  max: (v) => (control) =>
    control?.value > v.arguments
      ? { [v.message || "max-error"]: v.arguments }
      : null,
  min: (v) => (control) =>
    control?.value < v.arguments
      ? { [v.message || "min-error"]: v.arguments }
      : null,
  greaterThan: (v) => (control) =>
    control?.value <= v.arguments
      ? { [v.message || "greaterThan-error"]: v.arguments }
      : null,
  lessThan: (v) => (control) =>
    control?.value >= v.arguments
      ? { [v.message || "lessThan-error"]: v.arguments }
      : null,
  maxLength: (v) => (control) =>
    control?.value?.length > v.arguments
      ? { [v.message || "max-length-error"]: v.arguments }
      : null,
  minLength: (v) => (control) =>
    control?.value?.length < v.arguments
      ? { [v.message || "min-length-error"]: v.arguments }
      : null,
  latin: (v) => (control) =>{
    const p = v.arguments as RegExp || /^[a-zA-Z0-9^ ]+$/
    return empty(control) || p.test(control.value)
      ? null
      : { [v.message || "latin-error"]: true }},
  email: (v) => (control) => {

    const res = empty(control) || /^[^@]+@[^.]+\.[a-zA-Z.-]{2,20}$/.test(control.value)
      ? null
      : { [v.message || "email-error"]: true }

    return res
  },
  timeSpanMax: (v) => (control) =>
    Date.now() - (control.value as number) > (v.arguments as number)
      ? { [v.message || "timespan-max-error"]: true}
      : null,
  timeSpanMin: (v) => (control) =>
    Date.now() - (control.value as number) < (v.arguments as number)
      ? { [v.message || "timespan-min-error"]: true}
      : null,
};

function empty(control) {
  return control === null || control.value === null || control.value === undefined || control.value === "" || control.value.length === 0;
}

