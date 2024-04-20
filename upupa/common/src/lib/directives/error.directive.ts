

import { Directive, ElementRef, Input } from '@angular/core';

function errorMessage(error: { key: string, value: any }, field = 'field') {
    switch (error.key) {
        case 'required': return `${field} is required`
        case 'email': return 'email address is not valid'
        case 'minlength': return `${field} must be at least ${error.value.requiredLength} characters long`

        case 'max': return `${field} value of ${error.value.actual} must be less or equal to ${error.value.max}`
        case 'equal': {
            if (error.value.expected) return `${field} must be equal to ${error.value.expected}`
            else return `${field} is not as expected`
        }
        default: return `value of ${field} is invalid`;
    }
}


@Directive({
    selector: '[error]',
    standalone: true
})
export class ErrorMessageDirective {

    @Input() error?: { key: string, value: any }
    @Input() field?: string


    //write error message to the element innerHtml
    constructor(public host: ElementRef<HTMLElement>) {
        if (!host) return
    }

    ngOnChanges() {
        const message = this.error ? errorMessage(this.error, this.field) : ''
        this.host.nativeElement.innerHTML = message
    }

}
