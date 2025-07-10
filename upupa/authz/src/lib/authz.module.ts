import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { PERMISSIONS_BASE_URL } from "./di.tokens";

/**
 *
 * @param baseUrl The api base url that loads the permissions. @example: https://example.com/permissions
 * @param options
 * @returns
 */
export function provideAuthorization(baseUrl: string | (() => string), options?: { loginRedirect?: () => void; forbiddenRedirect?: () => void }): EnvironmentProviders {
    const opts = typeof baseUrl === "function" ? baseUrl : () => baseUrl;
    return makeEnvironmentProviders([{ provide: PERMISSIONS_BASE_URL, useFactory: opts }]);
}
