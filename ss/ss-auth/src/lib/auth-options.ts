import { _env_secret } from "@ss/common";
import { userSchemaFactory } from "./user.schema";
import { CookieOptions } from "express";

export class AuthCookiesOptions {
    constructor(
        readonly enabled = false,
        readonly cookieName = "ssr_jwt",
        readonly options?: CookieOptions,
    ) {
        this.options = {
            httpOnly: false, // Client-side JS can read this (important for SSR server)
            secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
            maxAge: 3600000, // 1 hour (same as token expiry)
            sameSite: "lax", // Good for CSRF protection
            // path: '/', // Default, usually not needed to specify
            ...options,
        };
    }
}

export class AuthOptions {
    resetTokenExpiry: number | string = "10m"; // https://github.com/zeit/ms
    accessTokenExpiry: number | string = "20m"; // https://github.com/zeit/ms
    refreshTokenExpiry: number | string = "7 days";
    verifyTokenExpiry: number | string = "20m";
    maximumAllowedLoginAttempts = 5;
    maximumAllowedLoginAttemptsExpiry = 60 * 5 * 1000; // 5 mins
    issuer: string = null;
    forceEmailVerification = false;
    forcePhoneVerification = false;
    sendWelcomeEmail = true;
    secret = _env_secret();

    externalAuth?: Record<string, Record<string, string>> = {};

    dbName = "DB_DEFAULT";
    userSchema = userSchemaFactory("ObjectId");

    useCookies = new AuthCookiesOptions();

    constructor(init?: Partial<AuthOptions>) {
        Object.assign(this, init);
    }
}
