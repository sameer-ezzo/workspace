import { Directive, input, inject, ElementRef, Injectable, OnInit, OnDestroy } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationStart, Router, ViewTransitionInfo, withViewTransitions } from "@angular/router";
import { filter, BehaviorSubject, Subscription } from "rxjs";

const _CURRENT_TRANSITION = new BehaviorSubject<ViewTransitionInfo["transition"] | undefined>(undefined);

export function withRichViewTransitionsService() {
    return withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: async (info) => {
            _CURRENT_TRANSITION.next(info.transition);
            await info.transition.finished;
            _CURRENT_TRANSITION.next(undefined);
        },
    });
}

export type ViewTransitionEvent = {
    stage: "start" | "source" | "end";
    fromUrl: string;
    toUrl: string;
    animations: Record<string, { fromElement?: HTMLElement }>;
};

@Injectable({ providedIn: "root" })
export class ViewTransitionService {
    router: Router = inject(Router);
    events = new BehaviorSubject<ViewTransitionEvent | undefined>(undefined);

    constructor() {
        this.router.events.subscribe((e) => {
            if (e instanceof NavigationStart) {
                // begin setting up the transition as early as possible
                if (!e) return this.events.next(undefined);

                const navigation = this.router.currentNavigation();
                const transitionEvent: ViewTransitionEvent = {
                    stage: "start",
                    fromUrl: this.router.routerState.snapshot.url,
                    toUrl: navigation?.finalUrl?.toString() ?? navigation?.initialUrl.toString() ?? "",
                    animations: {},
                };

                this.events.next(transitionEvent); // this will make sure ViewTranstionSource is called before

                transitionEvent.stage = "source";
                this.events.next(transitionEvent); // and now ViewTransitionDestination is called
            }
        });
    }

    setViewTransitionName(nativeElement: HTMLElement, viewTransitionName: string) {
        // const style = nativeElement.style as any;
        // style['view-transition-name'] = viewTransitionName;
    }
}

/**
 * Automatically sets the view transition name upon navigation start matching link elements inside the host. The input aliased as `view-transition-source` must be unique per page and is required.
 * @example [view-transition-source]="blog-{{blog.slug}}"
 */
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[view-transition-source]",
    standalone: true,
})
export class ViewTransitionSourceDirective {
    // viewTransitionName must be passed and must be unique per page
    viewTransitionName = input.required<string>({ alias: "view-transition-source" });

    host = inject<ElementRef<HTMLElement>>(ElementRef);
    viewTransitionService = inject<ViewTransitionService>(ViewTransitionService);
    router = inject<Router>(Router);

    // the below won't work because ContentChildren can only query for directives within the host's own template not child components
    // @ContentChildren(RouterLink, { descendants: true }) childDirectives!: QueryList<RouterLink>;

    constructor() {
        this.viewTransitionService.events
            .pipe(
                takeUntilDestroyed(),
                filter((e) => e?.stage === "start"),
            )
            .subscribe((e) => {
                // skip changes if navigation is back/forward history
                const navigation = this.router.currentNavigation();
                if (!e || navigation?.trigger !== "imperative") return;

                // clear the previous transition name (this directive is attached to multiple elements and at this stage we don't know which one is the source)
                this.clearViewTransitionName();

                const toPath = e.toUrl;
                const transitionName = this.viewTransitionName();
                if (!e.animations[transitionName]?.fromElement) {
                    // not set already
                    const query = this.host.nativeElement.querySelectorAll("a[href]"); // this can be optimized by using content observer instead of query selector
                    const anchors = Array.from(query) as HTMLAnchorElement[];
                    const links = anchors.map((a) => new URL(a.href).pathname);

                    // if one link inside the host component matches the destination path, then set the transition name and fromElement
                    if (links.some((l) => l === toPath)) {
                        e.animations[this.transitionId] ??= {};
                        e.animations[this.transitionId].fromElement = this.host.nativeElement;
                        this.viewTransitionService.setViewTransitionName(this.host.nativeElement, this.transitionId);
                    }
                }
            });
    }

    clearViewTransitionName() {
        this.viewTransitionService.setViewTransitionName(this.host.nativeElement, "");
    }

    // transition name cannot be used directly to ensure uniqueness on the page, thus current url is added
    get transitionId() {
        return `${this.viewTransitionName()}__${this.router.routerState.snapshot.url.split("/").join("-")}`;

        // to elaborate, to the case where home page has a grid of cards and each card has a link to the blog page. ideally the transition name should by set like view-transition-source="blog__{{blog.slug}}" to ensure uniqueness (per card).
        // but the same blogs cards grid can be used in the destination page (blog page) to link to related blogs for example, when if same transition name is used, that would mix the destination transmition element (example: blog cover and the blog card in the grid)
        // thus the transition name should be unique per all pages (not just one page), and the current url is added to ensure that
    }
}

/**
 * Use this directive on elements that view transition will land on. The input aliased as `view-transition-destination` must be unique per page and is required.
 */
@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[view-transition-destination]",
    standalone: true,
})
export class ViewTransitionDestinationDirective implements OnInit, OnDestroy {
    viewTransitionName = input.required<string>({ alias: "view-transition-destination" }); //TODO this is not used yet. it should be used as a matcher to only apply the transition if the transition animation relevant to the source (useful in cases multiple view transitions are happening at the same time)
    router = inject(Router);
    host = inject<ElementRef<HTMLElement>>(ElementRef);
    viewTransitionService = inject(ViewTransitionService);
    subscription!: Subscription;

    ngOnInit() {
        // apply the transition if this directive is being initialized (which indicates that the navigation is indeed coming to this component)
        this.updateViewTransition();

        // for future transitions (this directive may stay in memory in cases like route reuse or component reuse)
        this.subscription = this.viewTransitionService.events
            .pipe(filter((e) => e?.stage === "source")) // this stage is ensured to be emmited after 'start' stage
            .subscribe((e) => {
                // nothing on history navigation
                const navigation = this.router.currentNavigation();
                if (!e || navigation?.trigger != "imperative") return;

                this.updateViewTransition();
            });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    updateViewTransition() {
        // apply the transition if this directive is the destination
        const currentTransitionEvent = this.viewTransitionService.events.value;
        if (!currentTransitionEvent) return this.clearViewTransitionName();

        const viewTransitionName = Object.keys(currentTransitionEvent.animations)[0] ?? ""; // assume only one transition is happening at a time
        this.viewTransitionService.setViewTransitionName(this.host.nativeElement, viewTransitionName);
    }

    clearViewTransitionName() {
        this.viewTransitionService.setViewTransitionName(this.host.nativeElement, "");
    }
}
