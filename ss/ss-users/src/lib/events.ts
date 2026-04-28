import { User } from "@noah-ark/common";
import { UsersOptions } from "./types";
import { Verification } from "@ss/auth";

type UserEventLogPayload = {
    event: string;
    user?: {
        id?: unknown;
        email?: unknown;
        username?: unknown;
        name?: unknown;
        roles?: unknown;
    };
    verification?: {
        expire?: unknown;
        attempts?: unknown;
        sendAttempts?: unknown;
    };
    resetTokenIssued?: boolean;
};

function sanitizeUserForLogs(user?: Partial<User>): UserEventLogPayload["user"] {
    if (!user) return undefined;

    return {
        id: user._id,
        email: user.email,
        username: user.username,
        name: user.name,
        roles: user.roles,
    };
}

function hideField<T extends object>(target: T, key: keyof T) {
    Object.defineProperty(target, key, {
        enumerable: false,
        configurable: true,
        writable: true,
        value: target[key],
    });
}

export class UserForgotPasswordEvent {
    static EVENT_NAME = "user.forgot-password";
    user: User;
    options: UsersOptions;
    resetToken: string;
    constructor({ user, resetToken, options }) {
        this.user = user;
        this.options = options;
        this.resetToken = resetToken;
        hideField(this, "user");
        hideField(this, "options");
        hideField(this, "resetToken");
    }

    toLogPayload(): UserEventLogPayload {
        return {
            event: UserForgotPasswordEvent.EVENT_NAME,
            user: sanitizeUserForLogs(this.user),
            resetTokenIssued: true,
        };
    }
}

export class UserSignedUpEvent {
    static EVENT_NAME = "user.signed-up";

    user: User;
    options: UsersOptions;
    constructor({ user, options }) {
        this.user = user;
        this.options = options;
        hideField(this, "user");
        hideField(this, "options");
    }

    toLogPayload(): UserEventLogPayload {
        return {
            event: UserSignedUpEvent.EVENT_NAME,
            user: sanitizeUserForLogs(this.user),
        };
    }
}
export class UserCreatedEvent {
    static EVENT_NAME = "user.created";

    user: User;
    options: UsersOptions;
    constructor({ user, options }) {
        this.user = user;
        this.options = options;
        hideField(this, "user");
        hideField(this, "options");
    }

    toLogPayload(): UserEventLogPayload {
        return {
            event: UserCreatedEvent.EVENT_NAME,
            user: sanitizeUserForLogs(this.user),
        };
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
        hideField(this, "user");
        hideField(this, "options");
        hideField(this, "verification");
    }

    toLogPayload(): UserEventLogPayload {
        return {
            event: UserSendVerificationEvent.EVENT_NAME,
            user: sanitizeUserForLogs(this.user),
            verification: {
                expire: this.verification?.expire,
                attempts: this.verification?.attempts,
                sendAttempts: this.verification?.sendAttempts,
            },
        };
    }
}
