import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, ElementRef, forwardRef, inject, input, output } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatRadioModule } from "@angular/material/radio";

import { DynamicComponent, PortalComponent } from "@upupa/common";
import { MatSelectComponent } from "../select/select.component";
import { ParagraphComponent } from "../paragraph/paragraph.component";

@Component({
    selector: "choices-base-view-template",
    imports: [MatRadioModule, CommonModule, ParagraphComponent, MatIconModule, MatCheckboxModule, FormsModule, ReactiveFormsModule],
    host: {
        "[class]": "_classList()",
        "[attr.name]": "name()",
    },
    template: ``,
})
export class ChoicesBaseViewTemplateComponent {
    direction = input<"horizontal" | "vertical">("horizontal");
    template = input<"normal" | "thumbs">("normal");
    items = input<any[]>([]);
    control = input<any>(null);
    name = input<string>("");
    renderer = input<"markdown" | "html" | "none">("none");

    readonly _classList = computed(() => `${this.direction()} ${this.template() + " choices"}`);
    private readonly parentInstance = inject(MatChoicesComponent);

    private readonly host = inject(ElementRef);
    toggle(key: any) {
        this.parentInstance.toggle(key);
    }
}

@Component({
    selector: "radio-template",
    imports: [MatRadioModule, CommonModule, ParagraphComponent, MatIconModule, MatCheckboxModule, FormsModule, ReactiveFormsModule],
    host: {
        "[class]": "_classList()",
    },
    template: ` <mat-radio-group [formControl]="control()" [attr.name]="name()">
        @for (item of items(); track item.key) {
            <mat-radio-button class="choice" [value]="item.value">
                <paragraph [text]="item.display + ''" [renderer]="renderer()"></paragraph>
            </mat-radio-button>
        }
    </mat-radio-group>`,
})
export class RadioButtonGroupTemplateComponent extends ChoicesBaseViewTemplateComponent {}

@Component({
    selector: "check-boxes-template",
    imports: [MatRadioModule, CommonModule, ParagraphComponent, MatIconModule, MatCheckboxModule, FormsModule, ReactiveFormsModule],
    host: {
        "[class]": "_classList()",
        "[attr.name]": "name()",
    },
    template: `<div>
        @for (item of items(); track item.key) {
            <mat-checkbox class="choice" (change)="toggle(item.key)" [checked]="item.selected">
                <paragraph [text]="item.display + ''" [renderer]="renderer()"></paragraph>
            </mat-checkbox>
        }
    </div>`,
})
export class CheckBoxesTemplateComponent extends ChoicesBaseViewTemplateComponent {}

@Component({
    selector: "icon-choices-template",
    imports: [MatRadioModule, CommonModule, ParagraphComponent, MatIconModule, MatCheckboxModule, FormsModule, ReactiveFormsModule],
    host: {
        "[class]": "_classList()",
        "[attr.name]": "name()",
    },
    template: ` @for (item of items(); track item.key) {
        <button type="button" [style.width]="thumbSize() + 'px'" [style.height]="thumbSize() + 'px'" class="choice" (click)="toggle(item.key)">
            @if (item.image) {
                <img
                    style="width: 100%; height: 100%; object-fit: contain; object-position: center; padding: 20%; box-sizing: border-box"
                    [src]="item.image"
                    alt="{{ item.display }}"
                />
            }
            @if (item.selected) {
                <mat-icon>check</mat-icon>
            }
        </button>
    }`,
})
export class IconChoicesTemplateComponent extends ChoicesBaseViewTemplateComponent {
    // icon = input<string>("");
    thumbSize = input(75, {
        transform: (value) => Math.max(75, isNaN(+value) ? +value : 0),
    });
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
        CommonModule,
        MatCheckboxModule,
        MatRadioModule,
        MatIconModule,
        ParagraphComponent,
    ],
})
export class MatChoicesComponent extends MatSelectComponent {
    direction = input<"horizontal" | "vertical">("horizontal");
    choiceTemplate = input<DynamicComponent | null>(null);
    template = input<"normal" | "thumbs">("normal");

    readonly viewTemplate = computed(() => {
        const choiceTemplate = this.choiceTemplate();
        const direction = this.direction();
        const template = this.template();
        const isMulti = this.multiple();
        const items = this.items();
        const component = choiceTemplate?.component || (isMulti ? CheckBoxesTemplateComponent : RadioButtonGroupTemplateComponent);

        return {
            component,
            inputs: { direction, template, items, control: this.control(), ...choiceTemplate.inputs },
            outputs: choiceTemplate?.outputs,
            injector: choiceTemplate?.injector,
        } as DynamicComponent;
    });

    //todo: transform these templates to dynamic components
    renderer = input<"markdown" | "html" | "none">("none");

    rendererTemplate = input<DynamicComponent>(null);
}
