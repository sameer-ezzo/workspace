export enum AuthErrors {
    INVALID_CREDENTIALS,
    INVALID_TOKEN,
    TOKEN_EXPIRED
}

export class AuthError extends Error {
    constructor(code: AuthErrors, message: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}