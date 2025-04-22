import { CommonModule } from "@angular/common";
import { Component, forwardRef, Input, SimpleChanges, input, model } from "@angular/core";
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

import { DataAdapter } from "@upupa/data";
import { MatInputComponent } from "../../input/input.component";

// https://angular-slider.github.io/ngx-slider/demos
@Component({
    selector: "mat-form-slider-input",
    templateUrl: "./slider.component.html",
    styleUrls: ["./slider.component.scss"],
    // encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MatSliderComponent),
            multi: true,
        },
    ],
    imports: [CommonModule, MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatIconModule, MatButtonModule],
})
export class MatSliderComponent extends MatInputComponent<number> {
    floor = model<number>(0);
    ceil = model<number>(100);
    step = model<number>(1);
    readonly pushRange = input(false);
    readonly showSelectionBar = input(true);

    //@Input() selectionBarGradient: { from: string, to: string };
    //@Input() getSelectionBarColor: (value: number) => string;
    //@Input() getPointerColor: (value: number) => string;

    readonly direction = input<"horizontal" | "vertical">("horizontal");

    readonly adapter = input<DataAdapter>(undefined);

    _options = {
        floor: 0,
        ceil: 100,
        showTicks: true,
        tickStep: 20,
        stepsArray: [],
    } as any; //as Options;

    ngOnChanges(changes: SimpleChanges) {
        if (changes["floor"]) {
            if (this.value() < this.floor()) this.value.set(this.floor());
        }
        if (changes["ceiling"]) {
            if (this.value() > this.ceil()) this.value.set(this.ceil());
        }

        if (changes["adapter"]) {
            // this.adapter.normalized$.subscribe((n) => {
            //     this._options = {
            //         floor: 0,
            //         ceil: n.length - 1,
            //         showTicks: true,
            //         stepsArray: n.map((x, i) => {
            //             return { legend: <any>x.display, value: i };
            //         }),
            //     };
            // });
        }

        if (!this._options.stepsArray) {
            this._options.floor = this.floor;
            this._options.ceil = this.ceil;
            this._options.step = this.step;

            const interval = this.ceil() - this.floor();
            if (interval < 10) this._options.tickStep = this.step;
            else if (interval < 100) this._options.tickStep = Math.max(this.step(), Math.round(interval / 5));
        }

        this._options.vertical = this.direction() === "vertical";
    }

    _percentage = 0;
    get percentage(): number {
        return this._percentage;
    }
    set percentage(v: number) {
        this._percentage = v;
        this.value.set(Math.round(this.floor() + (this.ceil() - this.floor()) * v));
    }
}
