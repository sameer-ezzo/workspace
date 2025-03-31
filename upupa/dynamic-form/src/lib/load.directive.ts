import { ComponentRef, Directive, inject, output } from "@angular/core";

@Directive({
    selector: "[load]",
    standalone: true,
})
export class LoadDirective {
    load = output();

    ngAfterViewInit() {
        this.load.emit();
    }
}
