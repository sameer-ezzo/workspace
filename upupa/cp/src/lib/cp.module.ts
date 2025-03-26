// import { ModuleWithProviders, NgModule } from "@angular/core";
// import { CommonModule, DOCUMENT } from "@angular/common";
import { CP_OPTIONS, USER_PICTURE_RESOLVER } from "./di.token";
import { DataService } from "@upupa/data";
import { getUserInitialsImage } from "./user-image.service";
import { AuthService } from "@upupa/auth";
import { catchError, map, of, switchMap } from "rxjs";
import { DOCUMENT } from "@angular/common";
import { makeEnvironmentProviders } from "@angular/core";

const userImageProvider = {
    provide: USER_PICTURE_RESOLVER,
    useFactory: (auth: AuthService, data: DataService, document) => {
        if (!auth.user$) return of(getUserInitialsImage(document, ""));
        return auth.user$.pipe(
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
        providers: [userImageProvider],
    },
) {
    return makeEnvironmentProviders([
        {
            provide: CP_OPTIONS,
            useValue: options ?? {},
        },
        userImageProvider,
        ...(options.providers ?? []),
    ]);
}
