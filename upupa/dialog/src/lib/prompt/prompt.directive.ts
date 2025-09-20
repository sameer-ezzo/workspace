import { Directive, HostListener, Output, EventEmitter, output, input } from "@angular/core";
import { PromptService } from "./prompt.service";

@Directive({
    selector: "[prompt]",
    standalone: true,
})
export class PromptDirective {
     prompt = output<Event>();
    readonly label = input<string>(undefined, { alias: "prompt-text" });
    readonly title = input<string>(undefined, { alias: "prompt-title" });
    readonly actionText = input<string>(undefined, { alias: "action-text" });
    readonly placeholder = input<string>(undefined, { alias: "prompt-placeholder" });
    readonly type = input<string>(undefined, { alias: "prompt-type" });
    readonly value = input<string>(undefined, { alias: "prompt-value" });

    constructor(public promptService: PromptService) {}

    @HostListener("click", ["$event"])
    async onClick() {
        const result = await this.promptService.open({
            title: this.title(),
            text: this.label(),
            actionText: this.actionText(),
            placeholder: this.placeholder(),
            value: this.value(),
            type: this.type(),
        });
        if (result) {
            this.prompt.emit(result);
        }
    }
}
