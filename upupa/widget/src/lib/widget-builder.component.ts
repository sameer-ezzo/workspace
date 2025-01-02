import { Component, computed, inject, model, viewChild, ViewEncapsulation, input, SimpleChanges, OnChanges } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { PortalComponent, provideComponent } from "@upupa/common";
import { DialogService } from "@upupa/dialog";
import { firstValueFrom } from "rxjs";

import { WidgetSettingsComponent } from "./widget-settings.component";
import { WidgetBlueprintSelectorComponent } from "./widget-selector.component";
import { ComponentSelector, deMaterializeWidget, MaterializedWidget, materializeWidget, Widget, WidgetBlueprint } from "./model";

import { GridStackOptions } from "gridstack";
import { GridstackComponent, GridstackItemComponent, nodesCB } from "gridstack/dist/angular";
import { MatBtnComponent } from "@upupa/mat-btn";
import { formInput } from "@upupa/dynamic-form";
import { randomString } from "@noah-ark/common";
import { FormControl, NG_VALUE_ACCESSOR, NgControl, UntypedFormControl } from "@angular/forms";

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
    standalone: true,
    imports: [GridstackComponent, GridstackItemComponent, PortalComponent, MatButtonModule, MatIconModule],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: WidgetBuilderComponent, multi: true }],
    styles: `
        ::ng-deep {
            .grid-stack {
                --tw-gradient-from: #e5e7eb var(--tw-gradient-from-position);
                --tw-gradient-to: rgb(229 231 235 / 0) var(--tw-gradient-to-position);
                --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
                background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
                border-radius: 0.5rem;
                border: 1px solid #e5e7eb;
                position: relative;
            }
            .grid-stack-item-content {
                border-radius: 8px;
                cursor: grab;
                border: 1px solid #e5e7eb;
                background: #fff;
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
        }
    `,
    template: `
        <gridstack class="grid-stack" [options]="gridOptions()" (changeCB)="onNodesChange($event)">
            @for (widget of materializedWidgets(); track widget.id) {
                <gridstack-item [options]="widget">
                    <div style="display: flex; place-items: center; border-bottom: 1px dashed #e5e7eb;">
                        <button class="widget-button" style="scale: 0.8;" mat-icon-button (click)="settings(widget.id)"><mat-icon>settings</mat-icon></button>
                        <h3>{{ widget.title }}</h3>
                        <div style="flex: 1"></div>
                        <button class="widget-button" style="scale: 0.8;" mat-icon-button (click)="remove(widget.id)"><mat-icon>clear</mat-icon></button>
                    </div>
                    <portal [template]="widget.template"></portal>
                </gridstack-item>
            }
        </gridstack>
        <button mat-fab color="accent" (click)="add()" style="position: absolute;inset-block-end: 1.5rem;inset-inline-end: 1.5rem;">
            <mat-icon>add</mat-icon>
        </button>
    `,
})
export class WidgetBuilderComponent implements OnChanges {
    blueprints = input.required<WidgetBlueprint[], WidgetBlueprint[]>({ transform: (v) => v ?? [] });
    gridOptions = model<GridStackOptions>(DEFAULT_GRID_OPTIONS);

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

    async add() {
        // const btnDescriptor = btn();
        const dialogRef = this.dialog.open(
            { component: WidgetBlueprintSelectorComponent, inputs: { blueprints: this.blueprints() } },
            {
                footer: [
                    provideComponent({
                        component: MatBtnComponent,
                        inputs: { descriptor: { text: "Select", name: "select" } },
                        outputs: {
                            onClick: async () => {
                                const widgetSelector = await firstValueFrom(dialogRef.afterAttached()).then((ref) => ref.instance);
                                dialogRef.close(widgetSelector.selectedBlueprint());
                            },
                        },
                    }),
                ],
            },
        );

        // const selectedWidget = widgetSelector.selectedWidget();

        const blueprint = await firstValueFrom<WidgetBlueprint>(dialogRef.afterClosed());
        if (!blueprint) return;

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
        const widget = this.value().find((w) => w.id == id);
        const dialogRef = this.dialog.open(
            { component: WidgetSettingsComponent, inputs: { widget, blueprints: this.blueprints() } },
            {
                footer: [
                    provideComponent({
                        component: MatBtnComponent,
                        inputs: { descriptor: { text: "Select", name: "select" } },
                        outputs: {
                            onClick: async () => {
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
    _defaultControl = new FormControl();
    control = input<FormControl, FormControl>(this._control ?? this._defaultControl, { transform: (v) => v ?? this._defaultControl });
    handleUserInput(v: Widget[]) {
        this.value.set(v);

        if (this._ngControl) {
            // only notify changes if control was provided externally
            this.markAsTouched();
            this.propagateChange();
        } else {
            this.control().setValue(v);
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
