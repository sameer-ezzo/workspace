import { Directive, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { PromptService } from './prompt.service';


@Directive({
    selector: '[prompt]',
    standalone: true,
})
export class PromptDirective {
    @Output() prompt = new EventEmitter<Event>();
    @Input('prompt-text') label: string;
    @Input('prompt-title') title: string;
    @Input('prompt-no') no: string;
    @Input('prompt-yes') yes: string;
    @Input('prompt-placeholder') placeholder: string;
    @Input('prompt-type') type: string;
    @Input('prompt-value') value: string;

    constructor(public promptService: PromptService) { }

    @HostListener('click', ['$event'])
    async onClick() {
        const result = await this.promptService.open({
            title: this.title,
            text: this.label,
            no: this.no,
            yes: this.yes,
            placeholder: this.placeholder,
            value: this.value,
            type: this.type,
        });
        if (result) { this.prompt.emit(result); }
    }
}