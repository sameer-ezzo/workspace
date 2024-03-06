import { Component, Input, Output, EventEmitter, ViewChild, OnDestroy, OnChanges, Optional, ElementRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from '@upupa/auth';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'image',
    templateUrl: './image.component.html',
    styleUrls: ['./image.component.scss']
})
export class ImageComponent implements OnDestroy, OnChanges {
    source = '';
    sourceSub: Subscription;
    hasError = false;

    @Input() alt = '';

    @Input() src: string | File = '';
    @Input() loading: 'eager' | 'lazy' = 'lazy';

    @Input() width: number | 'auto' = 'auto';
    @Input() height: number | 'auto' = 'auto';
    @Input() includeAccess = false;
    @Output() errorEvent = new EventEmitter<any>();

    @ViewChild('renderer') renderer: ElementRef<HTMLImageElement>;
    @ViewChild('defaultErrorTemplate') defaultErrorTemplate: any;
    @Input() errorTemplate: any = null


    destroyed = new Subject<void>();
    ngOnDestroy(): void {
        this.destroyed.next();
        this.destroyed.complete();
    }

    constructor(@Optional() public auth: AuthService) { }







    styles = {}
    ngOnChanges(changes) {

        if (changes['src'] || changes['width'] || changes['height'] || changes['includeAccess']) {

            if (typeof this.src !== 'string') {
                const reader = new FileReader()
                reader.readAsDataURL(this.src);
                reader.onload = () => {
                    this.styles = { objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%' }
                    this.source = reader.result as string;
                }
            }
            else {
                if (!this.src?.trim()) return;
                this.setSource(this.src);
                if (this.includeAccess && this.auth) {
                    this.sourceSub?.unsubscribe();
                    this.sourceSub = this.auth.token$.pipe(takeUntil(this.destroyed)).subscribe(() => {
                        this.setSource(this.src as string);
                    });
                }
            }
        }
    }

    setSource(src: string) {
        this.hasError = false;
        const q: any = { view: 1 };
        this.styles = { width: this.width, height: this.height }
        if (this.width) q.w = this.width;
        if (this.height) q.h = this.height;
        if (this.includeAccess) q.access_token = this.auth.get_token();
        const queryString = Object.keys(q).map(n => `${n}=${q[n]}`).join('&');
        this.source = queryString.length > 0 ? `${src}?${queryString}` : src;
    }

    errorHandler(event, el) {
        this.hasError = true;
        this.errorEvent.emit(event);
        el.src = '';
        el.onerror = null;
        if (!this.errorTemplate) this.errorTemplate = this.defaultErrorTemplate;
    }

}