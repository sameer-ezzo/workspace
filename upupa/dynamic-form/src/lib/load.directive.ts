import { Directive, output } from "@angular/core";

@Directive({
    selector: "[load]",
})
export class LoadDirective {
    load = output();

    ngAfterViewInit() {
        this.load.emit();
    }
}
