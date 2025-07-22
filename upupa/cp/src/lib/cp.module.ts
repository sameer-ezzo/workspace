// import { ModuleWithProviders, NgModule } from "@angular/core";
// import { CommonModule, DOCUMENT } from "@angular/common";
import { CP_OPTIONS, USER_PICTURE_RESOLVER } from "./di.token";
import { DataService } from "@upupa/data";
import { getUserInitialsImage } from "./user-image.service";
import { AuthService } from "@upupa/auth";
import { catchError, filter, map, of, switchMap } from "rxjs";

import { makeEnvironmentProviders, DOCUMENT } from "@angular/core";

export const DEFAULT_USER_AVATAR_PROVIDER = {
    provide: USER_PICTURE_RESOLVER,
    useFactory: (auth: AuthService, data: DataService, document) => {
        if (!auth.user$) return of(getUserInitialsImage(document, ""));
        return auth.user$.pipe(
            filter((u) => !!u),
            switchMap((u) =>
                data.get<{ picture: string }>(`/user/${u.sub}?select=picture`).pipe(
                    map((res) => res.data?.[0]),
                    map((x) => x.picture as string),
                    catchError((e) => of(getUserInitialsImage(document, u.name ?? u.email))),
                ),
            ),
        );
    },
    deps: [AuthService, DataService, DOCUMENT],
};

export function provideControlPanel(
    options: {
        providers?: any[];
    } = {
        providers: [DEFAULT_USER_AVATAR_PROVIDER],
    },
) {
    return makeEnvironmentProviders([
        {
            provide: CP_OPTIONS,
            useValue: options ?? {},
        },
        DEFAULT_USER_AVATAR_PROVIDER,
        ...(options.providers ?? []),
    ]);
}
