import { PasswordStrength } from "@noah-ark/common";

export class AuthOptions {
    readonly baseUrl: string = "/auth";
    readonly passwordPolicy?: PasswordStrength;
    constructor(init?: Partial<AuthOptions>) {
        if (init) {
            Object.assign(this, init);
        }
    }
}
