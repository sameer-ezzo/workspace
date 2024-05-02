import { HttpException, HttpStatus } from "@nestjs/common"

export namespace AuthExceptions {
    export const InvalidSecurityCode = "INVALID_SECURITY_CODE"
    export const InvalidToken = "INVALID_TOKEN"
    export const INVALID_ATTEMPT = "INVALID_ATTEMPT"
    export const TOKEN_ALREADY_USED = "TOKEN_ALREADY_USED"
    export const USER_NO_LONGER_EXISTS = "USER_NO_LONGER_EXISTS"
    export const InvalidSignup = "INVALID_SIGNUP"
    export const InvalidUserData = "INVALID_USER_DATA"
    export const InvalidRolesData = "INVALID_ROLE_DATA"
    export const UserDisabled = "USER_DISABLED"
    export const UserNotFound = "USER_NOT_FOUND"
    export const InvalidVerificationCode = "INVALID_VERIFICATION_CODE"
    export const InvalidOperation = "INVALID_OPERATION"
    export const InvalidGrantType = "INVALID_GRANT_TYPE"
    export const TooManyAttempts = "TOO_MANY_ATTEMPTS"
    export const INVALID_PASSWORDLESS_SIGNIN_REQUEST = "INVALID_PASSWORDLESS_SIGNIN_REQUEST"
}
export class AuthException extends HttpException {
    constructor(public readonly code: string, message?: any) {
        super(null, HttpStatus.UNAUTHORIZED)
        if(message) {
            this.message = message
        }

    }
}