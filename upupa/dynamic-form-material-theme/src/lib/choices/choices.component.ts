
import { ChangeDetectionStrategy, Component, computed, ElementRef, forwardRef, HostListener, inject, input, output } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIcon } from "@angular/material/icon";
import { MatRadioModule } from "@angular/material/radio";

import { DynamicComponent, ErrorsDirective, FocusDirective, PortalComponent } from "@upupa/common";
import { MatSelectComponent } from "../select/select.component";
import { ParagraphComponent } from "../paragraph/paragraph.component";
import { CheckBoxGroupInputComponent } from "./checkbox-group-input";
import { RadioGroupInputComponent } from "./radio-group.component";
import { NormalizedItem } from "@upupa/data";

@Component({
    selector: "choice-view",
    imports: [ParagraphComponent, MatIcon],
    template: ` @if (item().image) {
            <img [src]="item().image" alt="Item Image" />
        } @else {
            @if (multi()) {
                <mat-icon>{{ item().selected ? "check_box" : "check_box_outline_blank" }}</mat-icon>
            } @else {
                <mat-icon>{{ item().selected ? "radio_button_checked" : "radio_button_unchecked" }}</mat-icon>
            }
        }
        <paragraph [text]="item().display + ''" [renderer]="renderer()"></paragraph>`,
    styles: ``,
    host: {
        "[class]": "_classList()",
        "[attr.name]": "item().key",

        "[attr.role]": "'button'",
        "[attr.aria-checked]": "item().selected",
        "[attr.aria-label]": "item().display",
        "[attr.aria-labelledby]": "item().key",
        "[attr.aria-describedby]": "item().description || item().display",
    },
})
export class ChoiceViewTemplateComponent<T extends NormalizedItem = NormalizedItem<any>> {
    multi = input<boolean>(false);
    item = input.required<T>();
    index = input<number>(0);
    _classList = computed(() => {
        return "choice-template widget-option " + (this.multi() ? "multi" : "single") + " " + (this.item().selected ? "selected" : "");
    });
    renderer = input<"markdown" | "html" | "none">("none");

    selectionChange = output<{ item: NormalizedItem<T>; state: boolean }>();

    @HostListener("click", ["$event"])
    toggle(event: MouseEvent) {
        event.stopPropagation();
        event.preventDefault();
        const item = this.item();
        const state = !item.selected;
        this.selectionChange.emit({ item, state });
    }
}
@Component({
    selector: "mat-form-choices-input",
    templateUrl: "./choices.component.html",
    styleUrls: ["./choices.component.scss"],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MatChoicesComponent), multi: true }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
    FormsModule,
    PortalComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FocusDirective,
    MatCheckboxModule,
    MatRadioModule,
    MatIcon,
    ErrorsDirective
],
})
export class MatChoicesComponent extends MatSelectComponent {
    direction = input<"horizontal" | "vertical">("horizontal");
    choiceTemplate = input<DynamicComponent | null>({ component: ChoiceViewTemplateComponent });

    readonly itemsTemplates = computed(() => {
        const choiceTemplate = this.choiceTemplate();
        const isMulti = this.multiple();
        const items = this.items();

        return items.map((item, index) => {
            const component = choiceTemplate?.component || (isMulti ? CheckBoxGroupInputComponent : RadioGroupInputComponent);

            return {
                component,
                inputs: { item, index, renderer: this.renderer(), multi: isMulti, ...choiceTemplate?.inputs },
                outputs: {
                    ...choiceTemplate?.outputs,
                    selectionChange: (source, { item, state }) => {
                        this.toggle(item.key);
                    },
                },
                injector: choiceTemplate?.injector,
            } as DynamicComponent;
        });
    });

    //todo: transform these templates to dynamic components
    renderer = input<"markdown" | "html" | "none">("none");

    rendererTemplate = input<DynamicComponent | null>(null);

    _doFilter(q) {
        const f = { ...this.adapter().filter(), search: q };
        this.adapter().load({ filter: f });
    }

    @HostListener("keydown", ["$event"])
    onKeydown(event: KeyboardEvent) {
        const key = event.key;
        const items = this.items();
        const index = items.findIndex((item) => item.selected);
        const length = items.length;
        // handle arrow keys, home, end, enter, space and tab
        // items are displayed in a css grid, so we need to handle the arrow keys accordingly based on current item position
        // layout direction could be rtl or ltr

        const isRtl = this._isRtl();
        const gridCols = this._getGridCols();
        const gridRows = this._getGridRows();
        // console.log("gridCols", gridCols);
        // console.log("gridRows", gridRows);

        const currentRow = Math.floor(index / gridCols);
        const currentCol = index % gridCols;
        const currentItem = items[index];

        const isFirstRow = currentRow === 0;
        const isLastRow = currentRow === gridRows - 1;
        const isFirstCol = currentCol === 0;
        const isLastCol = currentCol === gridCols - 1;

        if (key === "Enter" || key === " ") {
            event.preventDefault();
            this.toggle(currentItem.key);
        } else if (key === "ArrowUp") {
            event.preventDefault();
            if (isFirstRow) {
                this.setInputFocus(index);
            } else if (isFirstCol) {
                this.setInputFocus(index - gridCols);
            } else if (isLastCol) {
                this.setInputFocus(index - gridCols);
            } else if (isLastRow) {
                this.setInputFocus(index - gridCols);
            } else {
                this.setInputFocus(index - gridCols);
            }
        } else if (key === "ArrowDown") {
            event.preventDefault();
            if (isLastRow) {
                this.setInputFocus(index);
            } else if (isFirstCol) {
                this.setInputFocus(index + gridCols);
            } else if (isLastCol) {
                this.setInputFocus(index + gridCols);
            } else if (isFirstRow) {
                this.setInputFocus(index + gridCols);
            } else {
                this.setInputFocus(index + gridCols);
            }
        } else if (key === "ArrowLeft") {
            event.preventDefault();
            if (isFirstCol) {
                this.setInputFocus(index);
            } else if (isFirstRow) {
                this.setInputFocus(index - 1);
            } else if (isLastRow) {
                this.setInputFocus(index - 1);
            } else if (isLastCol) {
                this.setInputFocus(index - 1);
            } else {
                this.setInputFocus(index - 1);
            }
        } else if (key === "ArrowRight") {
            event.preventDefault();
            if (isLastCol) {
                this.setInputFocus(index);
            } else if (isFirstRow) {
                this.setInputFocus(index + 1);
            } else if (isLastRow) {
                this.setInputFocus(index + 1);
            } else if (isFirstCol) {
                this.setInputFocus(index + 1);
            } else {
                this.setInputFocus(index + 1);
            }
        } else if (key === "Home") {
            event.preventDefault();
            this.setInputFocus(0);
        } else if (key === "End") {
            event.preventDefault();
            this.setInputFocus(length - 1);
        } else if (key === "Tab") {
            event.preventDefault();
            if (event.shiftKey) {
                this.setInputFocus(index - 1);
            } else {
                this.setInputFocus(index + 1);
            }
        }
    }

    private setInputFocus(index: number) {
        const items = this.items();
        const item = items[index];
        if (item) {
            this.toggle(item.key);
            const element = this.host.nativeElement.querySelector(`[name="${item.key}"]`);
            if (element) {
                setTimeout(() => {
                    element.focus();
                }, 100);
            }
        }
    }

    private _getGridCols() {
        const gridTemplateColumns = getComputedStyle(this.host.nativeElement.querySelector(".choices-wrapper")).gridTemplateColumns;
        const cols = gridTemplateColumns.split(" ").filter((col) => col !== "auto" && col !== "min-content" && col !== "max-content");
        return cols.length;
    }

    private _getGridRows() {
        const gridTemplateRows = getComputedStyle(this.host.nativeElement.querySelector(".choices-wrapper")).gridTemplateRows;
        const rows = gridTemplateRows.split(" ").filter((row) => row !== "auto" && row !== "min-content" && row !== "max-content");
        return rows.length;
    }

    private readonly host = inject(ElementRef);
    private _isRtl() {
        return this.host.nativeElement.getAttribute("dir") === "rtl";
    }
}
