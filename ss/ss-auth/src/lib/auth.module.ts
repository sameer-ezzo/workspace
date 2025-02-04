import { DynamicModule, Inject, OnModuleInit, Provider } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuthOptions } from "./auth-options";
import { AuthenticationInterceptor } from "./auth.middleware";

import {  _env_secret } from "@ss/common";

import { PassportModule } from "@nestjs/passport";
import { FacebookStrategy } from "./external/facebook.strategy";
import { GoogleStrategy } from "./external/google.strategy";
import { DataService, getDataServiceToken } from "@ss/data";
import { AuthService } from "./auth.svr";
import { MongooseModule } from "@nestjs/mongoose";
import { userSchemaFactory } from "./user.schema";
import { roleSchema } from "./role.schema";
import { Schema } from "mongoose";

const defaultAuthOptions = new AuthOptions();
const _authOptions = {
    secret: _env_secret(),
    accessTokenExpiry: process.env.accessTokenExpiry || defaultAuthOptions.accessTokenExpiry,
    refreshTokenExpiry: process.env.refreshTokenExpiry || defaultAuthOptions.refreshTokenExpiry,
    forceEmailVerification: process.env.forceEmailVerification === "true",
    forcePhoneVerification: process.env.forcePhoneVerification === "true",
    issuer: process.env.issuer || defaultAuthOptions.issuer,
    maximumAllowedLoginAttempts: process.env.maximumAllowedLoginAttempts ? +process.env.maximumAllowedLoginAttempts : defaultAuthOptions.maximumAllowedLoginAttempts,
    maximumAllowedLoginAttemptsExpiry: process.env.maximumAllowedLoginAttemptsExpiry
        ? +process.env.maximumAllowedLoginAttemptsExpiry
        : defaultAuthOptions.maximumAllowedLoginAttemptsExpiry,
    resetTokenExpiry: process.env.resetTokenExpiry || defaultAuthOptions.resetTokenExpiry,
    sendWelcomeEmail: process.env.sendWelcomeEmail === "true",
} as AuthOptions;

if (process.env.GOOGLE_CLIENT_ID) {
    _authOptions.externalAuth ??= {};
    _authOptions.externalAuth.google ??= {
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        client_url: process.env.CLIENT_URL || "",
        callback_base: process.env.CALLBACK_BASE || "",
    };
}

if (process.env.FACEBOOK_APP_ID) {
    _authOptions.externalAuth ??= {};
    _authOptions.externalAuth.facebook ??= {
        app_id: process.env.FACEBOOK_APP_ID || "",
        app_secret: process.env.FACEBOOK_APP_SECRET || "",
        client_url: process.env.CLIENT_URL || "",
        callback_base: process.env.CALLBACK_BASE || "",
    };
}

export class AuthModule implements OnModuleInit {
    constructor(@Inject("DB_AUTH") public readonly data: DataService) {}
    async onModuleInit() {}

    static register(
        modelOptions: { dbName: string; userSchema: Schema; prefix?: string } = { dbName: "DB_DEFAULT", userSchema: userSchemaFactory("ObjectId") },
        authOptions: Partial<AuthOptions> = {},
    ): DynamicModule {
        if (!modelOptions || !modelOptions.userSchema || !modelOptions.dbName) throw new Error("Invalid options passed to AuthModule.register");
        const options = { ..._authOptions, ...authOptions } as AuthOptions;

        if (!options.secret) throw new Error("Secret not provided in AuthOptions");

        const providers: Provider[] = [
            AuthService,
            { provide: "USER_SCHEMA", useValue: modelOptions.userSchema },
            { provide: "AUTH_OPTIONS", useValue: options },
            {
                provide: "DB_AUTH",
                useExisting: getDataServiceToken(modelOptions.dbName),
            },
        ];

        //EXTERNAL AUTH
        if (options.externalAuth?.google) providers.push(GoogleStrategy);
        if (options.externalAuth?.facebook) providers.push(FacebookStrategy);

        return {
            global: true,
            module: AuthModule,
            exports: [...providers, MongooseModule],
            imports: [
                PassportModule,
                MongooseModule.forFeature(
                    [
                        { name: "user", collection: `${modelOptions.prefix ?? ""}user`, schema: modelOptions.userSchema },
                        { name: "role", collection: `${modelOptions.prefix ?? ""}role`, schema: roleSchema },
                    ],
                    modelOptions.dbName,
                ),
            ],
            controllers: [],
            providers: [
                {
                    provide: APP_INTERCEPTOR,
                    useClass: AuthenticationInterceptor,
                },
                ...providers,
            ],
        };
    }
}
