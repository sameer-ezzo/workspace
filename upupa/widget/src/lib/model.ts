import type { GridStackWidget } from "gridstack";
import { DynamicComponent } from "@upupa/common";
import { Class } from "@noah-ark/common";
import { FormViewModelMirror } from "@upupa/dynamic-form";

export type ComponentSelector = Omit<DynamicComponent, "component"> & { selector: string };
export type Widget = GridStackWidget & {
    id: string;
    title: string;
    icon?: string;
    cssClass?: string;
    template: ComponentSelector;
};

/**
 * @description This model used to actually render the widget on the editor grid.
 */
export type MaterializedWidget<T = unknown> = Omit<Widget, "template"> & { template: DynamicComponent<T> & ComponentSelector; style?: Record<string, string> };

/**
 * @description
 * A model used to build a widget object. Most properties are shared with the Widget model.
 * id: will act as the selector for the widget (to render the real component)
 * template: is the component representing the widget in the editor grid
 * template.inputs: are the default inputs for the template component of the widget to be built.
 */
export type WidgetBlueprint<T = unknown> = Omit<Widget, "template"> & {
    settingsForm: Class | FormViewModelMirror;
    description?: string;
    template: DynamicComponent<T>;
};

export function materializeWidget(baseWidget: Widget, blueprint: WidgetBlueprint): MaterializedWidget {
    return {
        ...baseWidget,
        template: {
            ...baseWidget.template,
            component: blueprint.template.component,
        },
        style: {
            "grid-column": `${baseWidget.x + 1} / span ${baseWidget.w ?? 1}`,
            "grid-row": `${baseWidget.y + 1} / span ${baseWidget.h ?? 1}`,
        },
    };
}

export function deMaterializeWidget(widget: MaterializedWidget): Widget {
    const _widget = { ...widget };
    delete _widget.style;
    return {
        ..._widget,
        template: {
            selector: widget.template.selector,
            inputs: widget.template.inputs,
            models: widget.template.models,
            outputs: widget.template.outputs,
            class: widget.template.class,
        },
    };
}
