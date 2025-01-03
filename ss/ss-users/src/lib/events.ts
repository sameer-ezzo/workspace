import { User } from "@noah-ark/common";
import { UsersOptions } from "./types";
import { Verification } from "@ss/auth";

export class UserForgotPasswordEvent {
    static EVENT_NAME = "user.forgot-password";
    user: User;
    options: UsersOptions;
    resetToken: string;
    constructor({ user, resetToken, options }) {
        this.user = user;
        this.options = options;
        this.resetToken = resetToken;
    }
}

export class UserSignedUpEvent {
    static EVENT_NAME = "user.signed-up";

    user: User;
    options: UsersOptions;
    constructor({ user, options }) {
        this.user = user;
        this.options = options;
    }
}
export class UserCreatedEvent {
    static EVENT_NAME = "user.created";

    user: User;
    options: UsersOptions;
    constructor({ user, options }) {
        this.user = user;
        this.options = options;
    }
}

export class UserSendVerificationEvent {
    static EVENT_NAME = "user.send-verification-notification";

    user: User;
    verification: Verification;
    options: UsersOptions;

    constructor({ verification, user, options }) {
        this.user = user;
        this.options = options;
        this.verification = verification;
    }
}
