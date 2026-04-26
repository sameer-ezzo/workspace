import { isPlatformServer } from "@angular/common";
import { EnvironmentProviders, PLATFORM_ID, REQUEST, inject, makeEnvironmentProviders, provideAppInitializer } from "@angular/core";
import { AuthService } from "./auth.service";

export type ServerAuthInitializationOptions = {
    onError?: (error: unknown) => void;
};

export function initializeAuthFromServerRequest(): void {
    const platformId = inject(PLATFORM_ID);
    if (!isPlatformServer(platformId)) return;

    const authService = inject(AuthService);
    const request = inject(REQUEST, { optional: true }) as Request | null;
    authService.fromCookies(request);
}

export function provideServerAuthFromRequest(options?: ServerAuthInitializationOptions): EnvironmentProviders {
    return makeEnvironmentProviders([
        provideAppInitializer(() => {
            try {
                initializeAuthFromServerRequest();
            } catch (error) {
                if (options?.onError) options.onError(error);
                else console.error("Failed to initialize auth from server request", error);
            }
            return null;
        }),
    ]);
}