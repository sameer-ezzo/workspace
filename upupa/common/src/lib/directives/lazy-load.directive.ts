import { Input, SimpleChanges, ElementRef, OnInit, OnChanges } from '@angular/core';
import { Directive } from '@angular/core';


@Directive({
    selector: '[lazyload]',
})
export class LazyLoadDirective implements OnInit,OnChanges {
    @Input() errorPlaceholder: string;
    @Input() srcSet: string;
    @Input() root: string | undefined = undefined;
    constructor(private el: ElementRef) { }

    ngOnInit(): void {

        const element = this.el.nativeElement as HTMLImageElement
        element.src = null
        this.srcSet = this.srcSet ?? element.dataset['src'];

        if (('loading' in document.createElement('img'))) { //check if browser natively supports lazy loading
            element.setAttribute('loading', 'lazy');
            element.src = this.srcSet;
        }
        else {
            const srcset = element.dataset['srcset'];
            const sizes = element.dataset['sizes'];

            if (this.srcSet) {
                element.dataset['src'] = this.srcSet;
                if (!element.classList.contains('lazyload'))
                    element.classList.add('lazyload');
            }
            if (srcset)
                element.dataset['srcset'] = srcset;
            if (sizes)
                element.dataset['sizes'] = sizes;
        }

        this.observe(element);

    }



    ngOnChanges(changes: SimpleChanges): void {
        if (changes['errorPlaceholder'])
            this.el.nativeElement.onerror = () => {
                this.el.nativeElement.src = this.errorPlaceholder;
                this.el.nativeElement.onerror = null;
            };
    }

    observe(image: HTMLImageElement) {
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.el.nativeElement.src = this.srcSet
                    lazyImageObserver.unobserve(entry.target)
                }
            });
        }, {
            root: this.root?.trim() ? document.querySelector(this.root) : document.body
        });
        lazyImageObserver.observe(image)
    }
}
