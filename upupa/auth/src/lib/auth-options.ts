import { PasswordStrength } from "@noah-ark/common";


export class AuthOptions {
    base_url?: string  = "/auth";
    password_policy?: PasswordStrength = new PasswordStrength();
}
