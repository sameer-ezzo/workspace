import { PasswordStrength } from "../../../../noah-ark/common/src/lib/password-strength-policy";

export class AuthOptions {
    base_url?: string  = "/auth";
    password_policy?: PasswordStrength = new PasswordStrength();
}
