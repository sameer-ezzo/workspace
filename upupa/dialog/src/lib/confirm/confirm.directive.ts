import { Directive, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { ConfirmService } from './confirm.service';

@Directive({
    selector: '[confirm]',
    standalone: true
 })
export class ConfirmDirective {
    @Output() confirm = new EventEmitter<Event>();
    @Input('confirm-text') confirmText: string;
    @Input('confirm-img') img: string;
    @Input('confirm-title') title: string;
    @Input('confirm-no') no: string;
    @Input('confirm-yes') yes: string;

    constructor(public confirmService: ConfirmService) { }

    @HostListener('click', ['$event'])
    async onClick($event) {
        const result = await this.confirmService.open({
            title: this.title,
            img: this.img,
            confirmText: this.confirmText,
            no: this.no,
            yes: this.yes
        });
        if (result) { this.confirm.emit($event); }
    }
}