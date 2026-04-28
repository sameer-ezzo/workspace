import { PasswordStrength } from "@noah-ark/common";

export type ClientAuthCookiesOptions = {
    enabled?: boolean;
    cookieName?: string;
};

export class AuthOptions {
    readonly baseUrl: string = "/auth";
    readonly passwordPolicy?: PasswordStrength;
    readonly useCookies?: ClientAuthCookiesOptions;
    constructor(init?: Partial<AuthOptions>) {
        if (init) {
            Object.assign(this, init);
        }
    }
}
