import { Component, Input, Output, EventEmitter, ViewChild, OnDestroy, OnChanges, ElementRef, signal, input, computed, inject } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import { AuthService } from "@upupa/auth";
import { takeUntil } from "rxjs/operators";
import { CommonModule, NgStyle } from "@angular/common";

@Component({
    standalone: true,
    selector: "image",
    imports: [CommonModule, NgStyle],
    templateUrl: "./image.component.html",
    styleUrls: ["./image.component.scss"],
    host: {
        "[attr.width]": "width()",
        "[attr.height]": "height()",
    },
})
export class ImageComponent implements OnDestroy, OnChanges {
    source = "";
    sourceSub: Subscription;
    hasError = signal(false);

    @Input() alt = "";

    src = input<string | File>("");
    loading = input<"eager" | "lazy">("lazy");

    width = input<number | "auto" | "unset">("unset");
    height = input<number | "auto" | "unset">("unset");

    @Input() includeAccess = false;
    @Output() errorEvent = new EventEmitter<any>();

    @ViewChild("renderer") renderer: ElementRef<HTMLImageElement>;
    @ViewChild("defaultErrorTemplate") defaultErrorTemplate: any;
    @Input() errorTemplate: any = null;

    destroyed = new Subject<void>();
    ngOnDestroy(): void {
        this.destroyed.next();
        this.destroyed.complete();
    }

    public readonly auth = inject(AuthService, { optional: true });

    styles = computed(() => ({
        width: this.width() === "auto" ? "auto" : `${this.width()}px`,
        height: this.height() === "auto" ? "auto" : `${this.height()}px`,
    }));

    _src = "";
    ngOnChanges(changes) {
        if (changes["src"] || changes["includeAccess"]) {
            if (this.src() instanceof File) {
                const reader = new FileReader();
                reader.onload = () => {
                    this._src = reader.result as string;
                    this.setSource();
                };
                reader.readAsDataURL(this.src() as File);
            } else {
                this._src = this.src() as string;
                this.setSource();
                if (this.includeAccess && this.auth) {
                    this.sourceSub?.unsubscribe();
                    this.sourceSub = this.auth.token$.pipe(takeUntil(this.destroyed)).subscribe(() => {
                        this.setSource();
                    });
                }
            }
        }
    }

    setSource() {
        const src = this._src;
        this.hasError.set(false);
        const q: any = { view: 1 };
        const w = this.width();
        const h = this.height();
        if (w !== "auto") q.w = w;
        if (h !== "auto") q.h = h;
        if (this.includeAccess) q.access_token = this.auth.get_token();
        const queryString = Object.keys(q)
            .map((n) => `${n}=${q[n]}`)
            .join("&");
        this.source = queryString.length > 0 ? `${src}?${queryString}` : src;
    }

    errorHandler(event, el) {
        this.hasError.set(true);
        this.errorEvent.emit(event);
        el.src = "";
        el.onerror = null;
        if (!this.errorTemplate) this.errorTemplate = this.defaultErrorTemplate;
    }
}
