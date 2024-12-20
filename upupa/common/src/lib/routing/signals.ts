import { inject, signal, effect, WritableSignal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { map } from "rxjs";



export function getRouteSegments(route: ActivatedRoute): { segment: string; config: string }[] {
    const parent = route.parent;

    const configSegments = route.snapshot.routeConfig?.path?.split("/") ?? [];
    const url = route.snapshot.url;

    const segments = url.map((urlSegment, i) => {
        return {
            segment: urlSegment.path,
            config: configSegments[i],
        };
    });

    if (parent) return [...segments, ...getRouteSegments(parent)];
    return segments;
}
export function routeParams() {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const params = toSignal(route.params);
    const result = signal<Params>(params());
    effect(() => result.set(params()), { allowSignalWrites: true });
    effect(() => {
        const value = result();
        const _value = Object.fromEntries(Object.entries(value).map(([key, value]) => [`:${key}`, value]));

        const segments = getRouteSegments(route);
        const _commands = segments.map((x) => [_value[x.config], x.segment]);

        if (_commands.some((x) => x[0] && x[0] != x[1])) {
            const commands = _commands.map((x) => x[0] ?? x[1]);
            router.navigate(commands);
        }
    });

    return result;
}

export function routeParam(paramName: string) {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const result = signal<string>(route.snapshot.params[paramName]);
    const params = toSignal(route.params.pipe(map((x) => x[paramName])));
    effect(() => result.set(params()), { allowSignalWrites: true });
    effect(() => {
        const value = result();
        const _name = `:${paramName}`;
        const segments = getRouteSegments(route);
        if (segments.some((x) => x.config == _name && x.segment != value)) {
            const commands = segments.map((x) => (x.config == _name ? value : x.segment));
            router.navigate(commands);
        }
    });
    return result;
}

export function fragment(): WritableSignal<string> {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const result = signal<string>(route.snapshot.fragment);
    const fragment = toSignal(route.fragment);

    // from route to model
    effect(() => result.set(fragment()), { allowSignalWrites: true });

    // from model to route
    effect(() => {
        const _model = result();
        const _current = route.snapshot.fragment;
        if (_model != _current) {
            router.navigate([], { fragment: _model, queryParams: route.snapshot.queryParams });
        }
    });

    return result;
}

export function queryParams() {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const queryParams = toSignal(route.queryParams);
    const result = signal<Params>(queryParams());

    effect(() => result.set(queryParams()), { allowSignalWrites: true });
    effect(() => {
        const value = result();
        const query = route.snapshot.queryParams;
        if (Object.keys(value).some((key) => value[key] != query[key])) {
            const queryParams = { ...query, ...value };
            router.navigate([], { queryParams, fragment: route.snapshot.fragment });
        }
    });

    return queryParams;
}

export function queryParam(paramName: string) {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const queryParam = toSignal(route.queryParams.pipe(map((x) => x[paramName])));
    const result = signal<string>(queryParam());
    effect(() => result.set(queryParam()), { allowSignalWrites: true });
    effect(() => {
        const value = result();
        const query = route.snapshot.queryParams;
        if (value != query[paramName]) {
            const queryParams = { ...query, [paramName]: value };
            router.navigate([], { queryParams, fragment: route.snapshot.fragment });
        }
    });
    return result;
}

export function signalLink<T = unknown>(main: WritableSignal<T>, branch: WritableSignal<T>) {
    //order of effects matters so fill the derived signal first then bypass first write on base signal
    effect(() => branch.set(main()), { allowSignalWrites: true });
    effect(() => main.set(branch()), { allowSignalWrites: true });
}
export function signalBranch<T = unknown>(main: WritableSignal<T>) {
    const branch = signal(main());
    signalLink(main, branch);
    return branch;
}