import { UserDevice } from "./user";

export type AuthGrantType = "password" | "refresh";

export enum AuthTokenType {
    Access = "acc",
    Refresh = "rfs",
    Reset = "rst",
    Verify = "vfy",
}

export enum AuthErrorCode {
    InvalidToken = "INVALID_TOKEN",
    InvalidGrantType = "INVALID_GRANT_TYPE",
    InvalidPassword = "INVALID_PASSWORD",
    InvalidUser = "INVALID_USER",
    UserNotFound = "USER_NOT_FOUND",
    AccessDenied = "ACCESS_DENIED",
}

export type PasswordSigninRequestGrant = {
    grant_type: "password";
    password: string;
} & ({ username: string } | { email: string } | { phone: string } | { id: string });

export type RefreshSigninRequestGrant = {
    grant_type: "refresh";
    refresh_token: string;
};

export type SigninRequest = {
    device?: UserDevice;
} & (PasswordSigninRequestGrant | RefreshSigninRequestGrant);

export type SocialAuthRequest = {
    token?: string;
    access_token?: string;
};

export type TokenPairResponse = {
    access_token: string;
    refresh_token: string;
};

export type ResetTokenResponse = {
    reset_token: string;
};

export type SigninResponse = TokenPairResponse | ResetTokenResponse;