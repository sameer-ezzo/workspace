import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
    selector: '[only-numbers]',
    standalone: true,
})
export class OnlyNumberDirective {

    constructor(private el: ElementRef<HTMLInputElement>) { }

    @Input('allow-navigation') allowNavigation = true;
    @Input('allowed-dots') allowedDots = 1;
    @Input('allowed-dashs') allowedDashs = 0;

    ngOnChanges(changes) {
        if (changes['allowNavigation']) this.allowNavigation = <any>this.allowNavigation === 'true' || <any>this.allowNavigation === '' || this.allowNavigation === true;
        if (changes['allowedDots']) if (typeof this.allowedDots === "string") this.allowedDots = +this.allowedDots;
        if (changes['allowedDashs']) if (typeof this.allowedDashs === "string") this.allowedDashs = +this.allowedDashs;
    }


    //todo: use vanilla keydown event instead of Hostlistener
    @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
        let e = event;
        if (this.allowNavigation && [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 || //Allow: Del, Backspace, Tab, Esc, Enter
            // Allow: Ctrl+A
            (e.key === 'A' && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl+C
            (e.key === 'C' && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl+V
            (e.key ==='V' && (e.ctrlKey || e.metaKey)) ||
            // Allow: Ctrl+X
            (e.key === 'X' && (e.ctrlKey || e.metaKey)) ||
            // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
        }

        const value = this.el.nativeElement.value || '';
        const chars = value.split('')
        if (this.allowedDots && e.key === '.' && this.allowedDots > chars.filter(x => x === '.').length) return; //allow dot
        if (this.allowedDashs && e.key === '-' && this.allowedDashs > chars.filter(x => x === '-').length) return; //allow dash

        let key = e.key;
        const digits = '1234567890';
        const arabic = '١٢٣٤٥٦٧٨٩٠';
        if (key && arabic.indexOf(key) > -1) { //replace arabic numbers
            e.preventDefault();
            const en = digits[arabic.indexOf(key)];
            this.el.nativeElement.value += en;
            //notify angular so model is updated accordingly
            this.el.nativeElement.dispatchEvent(new InputEvent('input', { bubbles: false, cancelable: true }));
        }

        //if not a digit prevent!
        if (digits.indexOf(key) === -1) e.preventDefault();
    }
}