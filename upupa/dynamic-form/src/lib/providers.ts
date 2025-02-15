import { Class } from "@noah-ark/common";
import { FormViewModelMirror } from "./decorators/form-input.decorator";
import { FormControl, FormGroup } from "@angular/forms";
import { DataFormComponent } from "./data-form/data-form.component";
import { DynamicComponent, provideRoute, RouteFeature } from "@upupa/common";
import { Route } from "@angular/router";

export type DynamicFormConfig = { viewModel: Class | FormViewModelMirror; value?: any; form?: FormGroup };

export function withFormComponent<T>(config: DynamicFormConfig): RouteFeature {
    return {
        name: "withFormComponent",
        modify: () => ({
            component: DataFormComponent,
            data: {
                viewModel: config.viewModel,
                value: config.value,
                form: config.form,
            },
        }),
    };
}

export function provideFormRoute<T>(config: Route & DynamicFormConfig, ...features: RouteFeature[]): Route {
    return provideRoute(config, withFormComponent(config), ...features);
}

export function composeForm<T>(config: { viewModel: Class | FormViewModelMirror; value?: T; form?: FormGroup ,control?: FormControl}): DynamicComponent<DataFormComponent> {
    return {
        component: DataFormComponent,
        inputs: {
            viewModel: config.viewModel,
            value: config.value,
            control: config.control,
            // form: config.form,
        },
    };
}