import { DynamicModule, Inject, OnModuleInit, Provider } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuthOptions } from "./auth-options";
import { AuthenticationInterceptor } from "./auth.middleware";

import { CommonModule, __secret } from "@ss/common";
import { randomString } from "@noah-ark/common";
import { logger } from "./logger";

import { PassportModule } from "@nestjs/passport";
import { FacebookStrategy } from "./external/facebook.strategy";
import { GoogleStrategy } from "./external/google.strategy";
import { DataModule, DataService, getDataServiceToken } from "@ss/data";
import { AuthService } from "./auth.svr";
import { MongooseModule } from "@nestjs/mongoose";
import { userSchemaFactory } from "./user.schema";
import { roleSchema } from "./role.schema";

const defaultAuthOptions = new AuthOptions();
const _authOptions = {
    secret: __secret(),
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

// @Module({})
export class AuthModule implements OnModuleInit {
    constructor(@Inject("DB_AUTH") public readonly data: DataService) {}
    async onModuleInit() {}

    static register(
        options: Partial<AuthOptions> = { dbName: "DB_DEFAULT", userSchema: userSchemaFactory("ObjectId") },
    ): DynamicModule {
        if (!options || !options.userSchema || !options.dbName) throw new Error("Invalid options passed to AuthModule.register");
        options = { ..._authOptions, ...options } as AuthOptions;
        if (options.secret !== __secret()) {
            logger.warn("Auth secret has been overridden (the one passed in env is used)");
            options.secret = __secret();
        }
        if (!options.secret) {
            logger.error("Auth secret is not set");

            const prod = process.env.NODE_PROD === "production";
            options.secret = prod ? randomString(10) : "dev-secret-PLEASE-CHANGE!";
            process.env.secret = options.secret;
            process.env.SECRET = options.secret;
        }

        const providers: Provider[] = [
            AuthService,
            { provide: "UserSchema", useValue: options.userSchema },
            { provide: "AUTH_OPTIONS", useValue: options },
            {
                provide: "DB_AUTH",
                useExisting: getDataServiceToken(options.dbName),
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
                DataModule,
                CommonModule,
                PassportModule,
                MongooseModule.forFeature(
                    [
                        { name: "user", schema: options.userSchema },
                        { name: "role", schema: roleSchema },
                    ],
                    options.dbName,
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
