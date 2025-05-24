import { EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { PERMISSIONS_BASE_URL } from "./di.tokens";

/**
 *
 * @param baseUrl The api base url that loads the permissions. @example: https://example.com/permissions
 * @param options
 * @returns
 */
export function provideAuthorization(baseUrl: string, options?: { loginRedirect?: () => void; forbiddenRedirect?: () => void }): EnvironmentProviders {
    return makeEnvironmentProviders([{ provide: PERMISSIONS_BASE_URL, useValue: baseUrl }]);
}
