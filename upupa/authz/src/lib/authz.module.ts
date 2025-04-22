import { EnvironmentProviders, inject, makeEnvironmentProviders } from "@angular/core";
import { PERMISSIONS_BASE_URL } from "./di.tokens";
import { FORBIDDEN_REDIRECT, LOGIN_REDIRECT } from "./guards/auth.guard";
import { Router, ActivatedRoute } from "@angular/router";

const defaultLoginRedirect = () => {
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const redirectTo = router.routerState.snapshot.root.queryParams["redirectTo"] ?? route.snapshot.url.join("/");

    router.navigate(["/login"], { queryParams: redirectTo ? { redirectTo } : null });
};

const defaultForbiddenRedirect = () => {
    const router = inject(Router);
    router.navigateByUrl("/forbidden");
};

export function provideAuthorization(baseUrl: string, options?: { loginRedirect?: () => void; forbiddenRedirect?: () => void }): EnvironmentProviders {
    return makeEnvironmentProviders([
        { provide: PERMISSIONS_BASE_URL, useValue: baseUrl },
        { provide: LOGIN_REDIRECT, useValue: options?.loginRedirect ?? defaultLoginRedirect },
        { provide: FORBIDDEN_REDIRECT, useValue: options?.forbiddenRedirect ?? defaultForbiddenRedirect },
    ]);
}
