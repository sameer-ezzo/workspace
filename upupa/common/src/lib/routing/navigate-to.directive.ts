import { Directive, OnChanges, inject, ElementRef, input, OnInit } from "@angular/core";
import { Route } from "@angular/router";


export type RoutesPaths<T extends readonly Route[]> = T[number]['path'] | (T[number]['children'] extends readonly Route[] ? RoutesPaths<T[number]['children']> : never);

export function navigate<K extends string = string>(route: K, ...args: any[]) {
    args = args.slice()
    return route.split('/').map(segment => {
        if (segment.startsWith(':')) {
            if (args.length === 0) throw new Error(`Cannot navigate to ${route}. Missing value for param ${segment}`)
            return args.shift()
        } else return segment
    }).join('/')
}


@Directive({
    selector: 'a[navigateTo]',
    standalone: true
})
export class NavigateDirective<T extends string> implements OnChanges, OnInit {

    host = inject(ElementRef);

    navigateTo = input.required<T>();
    params = input([], { transform: (v: string | any[]) => Array.isArray(v) ? v : v.split(',') });

    setHref() {
        const params = this.params() ?? [];
        this.host.nativeElement.href = navigate(this.navigateTo(), ...params);
    }


    _init = false
    ngOnInit() {

        //make sure host is anchor tag
        if (this.host.nativeElement.tagName !== 'A') {
            console.error('navigateTo directive must be used on an anchor tag', this.host.nativeElement)
        }

        this.setHref()
        this._init = true
    }

    ngOnChanges() {
        if (!this._init) return
        this.setHref()
    }
}

