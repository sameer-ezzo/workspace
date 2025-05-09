import { Component, computed, inject, model, viewChild, input, SimpleChanges, OnChanges, output, Injector } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { _defaultControl, DynamicComponent, PortalComponent, provideComponent } from "@upupa/common";
import { DialogConfig, DialogService } from "@upupa/dialog";
import { firstValueFrom } from "rxjs";

import { WidgetSettingsComponent } from "./widget-settings.component";
import { IconChoicesTemplateComponent } from "./widget-selector.component";
import { ComponentSelector, deMaterializeWidget, MaterializedWidget, materializeWidget, Widget, WidgetBlueprint } from "./model";

import { GridStackOptions } from "gridstack";
import { GridstackComponent, GridstackItemComponent, nodesCB } from "gridstack/dist/angular";
import { MatBtnComponent } from "@upupa/mat-btn";
import { formInput } from "@upupa/dynamic-form";
import { randomString } from "@noah-ark/common";
import { FormControl, NG_VALUE_ACCESSOR, NgControl, UntypedFormControl } from "@angular/forms";
import { createDataAdapter } from "@upupa/data";
import { MatChoicesComponent } from "@upupa/dynamic-form-material-theme";

@Component({
    selector: "widget-header",
    imports: [MatIconModule, MatButtonModule],
    template: ` <div style="display: flex; place-items: center; border-bottom: 1px dashed #e5e7eb;">
        <button class="widget-button" style="scale: 0.8;" mat-icon-button (click)="settings.emit(widget())"><mat-icon>settings</mat-icon></button>
        <h3>{{ widget().title }}</h3>
        <div style="flex: 1"></div>
        <button class="widget-button" style="scale: 0.8;" mat-icon-button (click)="remove.emit(widget())"><mat-icon>clear</mat-icon></button>
    </div>`,
})
export class WidgetHeaderComponent {
    widget = input.required<Widget>();
    remove = output<Widget>();
    settings = output<Widget>();
}

export const DEFAULT_GRID_OPTIONS: GridStackOptions = {
    margin: 5,
    minRow: 1,
    cellHeight: 130,
    animate: true,
    float: true,
    column: 12,
    layout: "compact",
    maxRow: 10,
};

export class InputsViewModel {
    @formInput()
    text = "";
}

@Component({
    selector: "widget-builder",
    imports: [GridstackComponent, GridstackItemComponent, PortalComponent, MatButtonModule, MatIconModule],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WidgetBuilderComponent, multi: true }],
    styles: `
        ::ng-deep {
            .grid-stack {
                // --tw-gradient-from: #e5e7eb var(--tw-gradient-from-position);
                // --tw-gradient-to: rgb(229 231 235 / 0) var(--tw-gradient-to-position);
                // --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
                // background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
                border-radius: var(--mat-sys-corner-small);
                border: 1px solid var(--mat-sys-outline-variant);
                position: relative;
            }
            .grid-stack-item-content {
                border-radius: var(--mat-sys-corner-small);
                cursor: grab;
                border: 1px solid var(--mat-sys-outline-variant);
                background: var(--mat-sys-surface-container-low);
            }

            .grid-stack-item-content:hover .widget-button,
            .grid-stack-item-content:focus-within .widget-button {
                visibility: visible;
            }
        }
        .widget-button {
            visibility: hidden;
        }
        :host {
            display: block;
            position: relative;
            // margin-block-end: calc(65px + 1.5rem);
            box-sizing: border-box;
            overflow-x: hidden;
            button {
                position: absolute;
                float: inline-end;
                bottom: 1.5rem;
                z-index: 100;
                inset-inline-end: 1.5rem;
            }
        }
    `,
    template: `
        @if (materializedWidgets().length) {
            <gridstack #grid class="grid-stack" [options]="gridOptions()" (changeCB)="onNodesChange($event)">
                @for (widget of materializedWidgets(); track widget.id) {
                    <gridstack-item [options]="widget" (click)="focused.set(widget)">
                        @if (headerTemplate()) {
                            <portal [template]="getHeaderTemplate(widget)"></portal>
                        }
                        <portal [template]="widget.template"></portal>
                    </gridstack-item>
                }
            </gridstack>
        } @else {
            <ng-content class="empty-state"></ng-content>
        }
        <button mat-fab color="accent" (click)="add()">
            <mat-icon>add</mat-icon>
        </button>
    `,
})
export class WidgetBuilderComponent implements OnChanges {
    blueprints = input.required<WidgetBlueprint[], WidgetBlueprint[]>({ transform: (v) => v ?? [] });
    gridOptions = model<GridStackOptions>(DEFAULT_GRID_OPTIONS);

    headerTemplate = input<DynamicComponent>({ component: WidgetHeaderComponent });
    getHeaderTemplate = (widget: Widget) => {
        return this.headerTemplate()
            ? {
                  ...this.headerTemplate(),
                  inputs: { ...this.headerTemplate().inputs, widget },
              }
            : null;
    };
    dialogOptions = input<DialogConfig>();
    focused = model<Widget | null>(null);
    value = model<Widget[]>([]);
    disabled = model<boolean>(false);

    materializedWidgets = computed<MaterializedWidget[]>(() => {
        const blueprints = this.blueprints();
        return (this.value() ?? []).map((widget) => {
            const blueprint = blueprints.find((w) => w.id === widget.template.selector);
            return materializeWidget(widget, blueprint);
        });
    });

    dialog = inject(DialogService);

    gridComponent = viewChild(GridstackComponent);
    grid = computed(() => this.gridComponent().grid);

    ngOnChanges(changes: SimpleChanges) {
        if (!this.gridOptions()) {
            this.gridOptions.set(DEFAULT_GRID_OPTIONS);
        }
        if (changes["disabled"]) {
            this.gridOptions.update((x) => ({ ...x, staticGrid: this.disabled() }));
        }
    }

    async openSelectWidgetDialog() {
        // const btnDescriptor = btn();
        const adapter = createDataAdapter(
            {
                type: "signal",
                data: this.blueprints,
                keyProperty: "id",
                displayProperty: "title",
                terms: [{ field: "title", type: "like" }],
            },
            this._injector,
        );
        const dialogRef = this.dialog.open(
            {
                component: MatChoicesComponent,
                inputs: {
                    choiceTemplate: { component: IconChoicesTemplateComponent },
                    adapter,
                    value: this.blueprints()?.[0],
                },
            },
            {
                ...this.dialogOptions(),
                footer: [
                    provideComponent({
                        component: MatBtnComponent,
                        inputs: { buttonDescriptor: { text: "Select", name: "select" } },
                        outputs: {
                            action: async () => {
                                console.log("selected widget", adapter.selection()?.[0]);

                                // const widgetSelector = await firstValueFrom(dialogRef.afterAttached()).then((ref) => ref.instance);
                                dialogRef.close(adapter.selection()?.[0]);
                            },
                        },
                    }),
                ],
            },
        );

        // const selectedWidget = widgetSelector.selectedWidget();

        const blueprint = await firstValueFrom<WidgetBlueprint>(dialogRef.afterClosed());
        if (!blueprint) return null;
        return blueprint;
    }
    private _injector = inject(Injector);
    async add(blueprint: WidgetBlueprint | null = null) {
        if (!blueprint) blueprint = await this.openSelectWidgetDialog();
        const id = randomString(8);
        const x = blueprint.x ?? 0;
        const y = this.value()?.length ? (blueprint.y ?? this.grid().getRow()) : 0;
        const selector = blueprint.id;
        const template = { ...blueprint.template, selector, component: undefined } as ComponentSelector;
        const _blueprint = { ...blueprint };
        delete _blueprint.description;
        delete _blueprint.settingsForm;
        const widget: Widget = { ..._blueprint, id, x, y, template };

        this.handleUserInput([...(this.value() ?? []), widget]);
        // this.gridOptions.update((x) => ({ ...x, layout: "compact" }));
    }

    remove(id: string) {
        this.handleUserInput((this.value() ?? []).filter((w) => w.id !== id));
    }

    async settings(id: string) {
        const widget = this.value().find((w) => w.id === id);
        const dialogRef = this.dialog.open(
            { component: WidgetSettingsComponent, inputs: { widget, blueprints: this.blueprints() } },
            {
                footer: [
                    provideComponent({
                        component: MatBtnComponent,
                        inputs: { buttonDescriptor: { text: "Select", name: "select" } },
                        outputs: {
                            action: async () => {
                                const componentInstance = await firstValueFrom(dialogRef.afterAttached()).then((ref) => ref.instance);
                                dialogRef.close({ settings: componentInstance.settings(), inputs: componentInstance.inputs() });
                            },
                        },
                    }),
                ],
            },
        );

        const dialogResult = await firstValueFrom(dialogRef.afterClosed());
        if (!dialogResult) return;

        const items = (this.value() ?? []).filter((w) => w.id !== id);

        const { settings, inputs } = dialogResult;
        widget.x = settings.x;
        widget.y = settings.y;
        widget.w = settings.w;
        widget.h = settings.h;
        widget.title = settings.title;
        widget.cssClass = settings.cssClass;
        widget.template.inputs = inputs;

        widget.id = randomString(8); // change the id to trigger @for loop re-render

        this.handleUserInput([...items, widget]);
    }

    public onNodesChange(_data: nodesCB) {
        const materializedItems = this.grid().save(true) as MaterializedWidget[];
        const items = materializedItems.map((item) => deMaterializeWidget(item));
        this.handleUserInput(items);
    }

    // >>>>> ControlValueAccessor ----------------------------------------

    _ngControl = inject(NgControl, { optional: true }); // this won't cause circular dependency issue when component is dynamically created
    _control = this._ngControl?.control as UntypedFormControl; // this won't cause circular dependency issue when component is dynamically created
    _defaultControl = _defaultControl(this);
    control = input<FormControl<Widget[]>>(this._control ?? this._defaultControl);
    handleUserInput(v: Widget[]) {
        this.value.set(v);

        if (this._ngControl) {
            // only notify changes if control was provided externally
            this.markAsTouched();
            this.propagateChange();
        } else {
            const control = this.control();
            if (control?.value !== v) control.setValue(v);
        }
    }

    _onChange: (value: Widget[]) => void;
    _onTouch: () => void;

    propagateChange() {
        this._onChange?.(this.value());
    }

    markAsTouched() {
        if (this._onTouch) this._onTouch();
    }

    writeValue(v: Widget[]): void {
        this.value.set(v);
    }

    registerOnChange(fn: (value: Widget[]) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouch = fn;
    }
    setDisabledState?(isDisabled: boolean): void {
        this.disabled.set(isDisabled);
    }
}
