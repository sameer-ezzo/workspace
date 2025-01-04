import { PasswordStrength } from "./password-strength-policy";

export class AuthOptions {
    base_url?: string  = "/auth";
    password_policy?: PasswordStrength = new PasswordStrength();
}
