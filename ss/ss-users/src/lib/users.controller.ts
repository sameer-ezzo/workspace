import { Body, Controller, Get, HttpStatus, Inject, Redirect, Req, Request, Res, UseGuards } from "@nestjs/common";

import { AuthGuard } from "@nestjs/passport";

import type { IncomingMessage, UserDevice } from "@noah-ark/common";
import { User } from "@noah-ark/common";
import { PasswordSigninRequestGrant, RefreshSigninRequestGrant, SigninRequest, SocialAuthRequest, SigninResponse, TokenPairResponse } from "@noah-ark/common";

import { Authorize, AuthorizeService } from "@ss/rules";
import { EndPoint, Message } from "@ss/common";
import { DataChangedEvent, DataService } from "@ss/data";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { logger } from "./logger";
import { AuthService, TokenTypes, UserDocument } from "@ss/auth";
import { AuthExceptions } from "./auth-exception";
import { AppError, toHttpException } from "@ss/common";
import { UsersOptions } from "./types";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { UserCreatedEvent, UserForgotPasswordEvent, UserSendVerificationEvent, UserSignedUpEvent } from "./events";

const usernameRegex = /^[a-zA-Z0-9_.-@]+$/;
//const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-\.]+$/;
const phoneRegex = /^\+[0-9]+$/;

function validateUser(user: Partial<User>): string[] {
    const errors = [];

    // validation
    // protect sensitive fields
    if (user.roles != null) errors.push("ROLES_OVER_POST");
    if (user.claims != null) errors.push("CLAIMS_OVER_POST");

    if (!user.username && !user.phone && !user.email) errors.push("USERNAME_OR_PHONE_OR_EMAIL_REQUIRED");
    if (user.username) {
        if (user.username.length < 3) errors.push("USERNAME_TOO_SHORT");
        if (user.username.length > 50) errors.push("USERNAME_TOO_LONG");

        if (!usernameRegex.test(user.username)) errors.push("USERNAME_INVALID");

        user.username = user.username.toLowerCase();
    }
    if (user.email) {
        if (user.email.length < 3) errors.push("EMAIL_TOO_SHORT");
        if (user.email.length > 50) errors.push("EMAIL_TOO_LONG");

        // if (!emailRegex.test(user.email)) errors.push("EMAIL_INVALID");
        if (user.email.length > 50) errors.push("EMAIL_TOO_LONG");
        user.email = user.email.toLowerCase();
    }

    if (user.phone) {
        user.phone = user.phone.toLowerCase().replace(/[^0-9+]/g, "") as User["phone"];
        if (user.phone && !phoneRegex.test(user.phone)) errors.push("PHONE_INVALID");
    }

    // ensure consistency
    if (user.phone && !user.phone.startsWith("+")) errors.push("PHONE_MUST_STARTS_WITH_PLUS");

    return errors;
}

@Controller("auth")
export class UsersController {
    private static readonly VERIFY_WINDOW_MS = 20 * 60 * 1000;
    private static readonly VERIFY_RESEND_COOLDOWN_MS = 60 * 1000;
    private static readonly VERIFY_MAX_SEND_ATTEMPTS = 5;
    private static readonly ALLOWED_VERIFY_TARGETS = new Set(["email", "phone"]);

    constructor(
        private auth: AuthService,
        @Inject("USERS_OPTIONS") private readonly options: UsersOptions,
        @Inject("DB_AUTH") private dataService: DataService,
        private authorizationService: AuthorizeService,
        private eventEmitter: EventEmitter2,
    ) {
        // this.http = new Axios({
        //     transformResponse: [(data) => JSON.parse(data)],
        // });
    }

    @EndPoint({ event: "data-changed", path: "data-changed" })
    public async userChanged(@Message() msg: IncomingMessage<DataChangedEvent<User>>) {
        const payload = this.requirePayload(msg.payload, "INVALID_PAYLOAD");
        const { path, patches, data } = payload;
        const model = await this.dataService.getModel("user");
        if (!model) return;
        if (new RegExp(`^/user/([a-z0-9]+)$`).test(path)) {
            if (patches.some((p: { path: string }) => p.path.includes("email"))) await model.updateOne({ _id: data._id }, { $set: { emailVerified: false, emailVerification: undefined } });
            if (patches.some((p: { path: string }) => p.path.includes("phone"))) await model.updateOne({ _id: data._id }, { $set: { phoneVerified: false, phoneVerification: undefined } });
        }
    }

    @Authorize({ by: "anonymous", access: "grant" })
    @EndPoint({
        http: { method: "POST", path: "forgot-password" },
        operation: "Forgot Password",
    })
    public async forgotPassword(@Message() msg: IncomingMessage<{ email: string }>) {
        const { email } = this.requirePayload(msg.payload, "MISSING_INFO");
        if (!email) throw toHttpException(new AppError("Missing email", { code: "MISSING_EMAIL", status: HttpStatus.BAD_REQUEST }));

        const user = await this.auth.findUserByEmail(email);
        if (!user) throw toHttpException(new AppError("Invalid user", { code: "INVALID_USER", status: HttpStatus.BAD_REQUEST }));

        const resetToken = await this.auth.issueResetPasswordToken(user);
        const expire = user.get("forgetExpire");
        const now = new Date().getTime();
        if (expire && expire > now) throw toHttpException(new AppError("Already sent", { code: "ALREADY_SENT", status: HttpStatus.BAD_REQUEST }));

        user.set("forgetExpire", now + 1000 * 60 * 10);
        await user.save();
        this.eventEmitter.emit(UserForgotPasswordEvent.EVENT_NAME, new UserForgotPasswordEvent({ user, resetToken, options: this.options }));
        return { email: user.email };
    }

    @EndPoint({
        http: { method: "POST", path: "resetpassword" },
        operation: "Reset Password",
    })
    @Authorize({ by: "anonymous", access: "grant" })
    public async resetpassword(
        @Message()
        msg: IncomingMessage<{ new_password: string; reset_token: string }>,
    ) {
        const payload = this.requirePayload(msg.payload, "MISSING_INFO");
        const new_password = payload.new_password;
        const reset_token = payload.reset_token;
        if (!new_password || !reset_token) throw toHttpException(new AppError("Invalid data", { code: "INVALID_DATA", status: HttpStatus.BAD_REQUEST }));
        try {
            const reset = await this.auth.resetPassword(reset_token, new_password);
            return { reset };
        } catch (error) {
            //todo: error msg
            logger.error(error);
            throw toHttpException(error);
        }
    }

    @EndPoint({
        http: { method: "POST", path: "changepassword/:id" },
        operation: "Change Password",
    })
    @Authorize({ by: "user", access: "grant" })
    public async changePassword(
        @Message()
        msg: IncomingMessage<{ new_password: string; old_password: string }>,
    ) {
        if (!msg.payload) throw toHttpException(new AppError("Missing info", { code: "MISSING_INFO", status: HttpStatus.BAD_REQUEST }));
        const { new_password, old_password } = msg.payload;
        if (new_password === old_password) return true;

        const id = msg.query?.id as string;
        if (!id) throw toHttpException(new AppError("Missing id", { code: "MISSING_ID", status: HttpStatus.BAD_REQUEST }));
        const user = await this.auth.findUserById(id);
        if (!user) throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));

        if (new_password) {
            try {
                const result = await this.auth.changePassword(id, old_password, new_password);
                if (result) return true;
                else throw toHttpException(new AppError("Invalid password", { code: "INVALID_PASSWORD", status: HttpStatus.BAD_REQUEST }));
            } catch (error) {
                //todo: error msg
                logger.error(error);
                throw toHttpException(error);
            }
        } else throw toHttpException(new AppError("Invalid data", { code: "INVALID_DATA", status: HttpStatus.BAD_REQUEST }));
    }

    @EndPoint({
        http: { method: "POST", path: "adminreset" },
        operation: "Reset User's Password",
    })
    @Authorize({ by: "role", value: "super-admin" })
    public async adminReset(
        @Message()
        msg: IncomingMessage<{
            email: string;
            new_password: string;
            forceChangePwd: boolean;
        }>,
    ) {
        if (!msg.payload) throw toHttpException(new AppError("Missing info", { code: "MISSING_INFO", status: HttpStatus.BAD_REQUEST }));
        const { email, new_password, forceChangePwd } = msg.payload;
        //todo: register this event with admin info
        const { access, rule, source } = this.authorizationService.authorize(msg, "update");
        if (access === "deny") throw toHttpException(new AppError("Access denied", { code: "ACCESS_DENIED", status: HttpStatus.FORBIDDEN, details: { rule, source } }));

        const user = await this.auth.findUserByEmail(email);
        if (!user) throw toHttpException(new AppError("Invalid user", { code: "INVALID_USER", status: HttpStatus.NOT_FOUND }));

        const resetToken = await this.auth.issueResetPasswordToken(user);
        const result = await this.auth.resetPassword(resetToken, new_password, forceChangePwd === true);
        await this.auth.signOut(user);

        if (result) return { result: true };
        else throw toHttpException(new AppError("Invalid operation", { code: "INVALID_OPERATION", status: HttpStatus.BAD_REQUEST }));
    }

    @EndPoint({
        http: { method: "POST", path: "addusertoroles" },
        operation: "Add User To Roles",
    })
    @Authorize({ by: "role", value: "super-admin" })
    public async addUserToRoles(@Message() msg: IncomingMessage<{ userId: string; roles: string[] }>) {
        const payload = this.requirePayload(msg.payload, "MISSING_INFO");
        const { userId, roles } = payload;
        if (!userId) throw toHttpException(new AppError("Missing user id", { code: "MISSING_USER_ID", status: HttpStatus.BAD_REQUEST }));
        const usersModel = await this.dataService.getModel("user");
        if (!usersModel) throw toHttpException(new AppError("Missing user model", { code: "MISSING_USER_MODEL", status: HttpStatus.BAD_REQUEST }));
        const user = await usersModel.findOne({ _id: userId });
        if (!user) throw toHttpException(new AppError("User not found", { code: "USER_NOT_FOUND", status: HttpStatus.NOT_FOUND }));
        await this.auth.addUserToRoles(user._id, roles);

        this.auth.signOut(user);
        return payload;
    }

    @EndPoint({
        http: { method: "POST", path: "changeuserroles" },
        operation: "Change User Roles",
    })
    @Authorize({ by: "role", value: "super-admin" })
    public async changeUserRoles(@Message() msg: IncomingMessage<{ userId: string; roles: string[] }>) {
        const payload = this.requirePayload(msg.payload, "MISSING_INFO");
        const { userId, roles } = payload;
        await this.auth.changeUserToRoles(userId, roles);
        this.auth.signOut({ _id: userId });
        return payload;
    }

    @EndPoint({
        http: { method: "POST", path: "admincreateuser" },
        operation: "Admin Create User",
    })
    @Authorize({ by: "role", value: "super-admin" })
    public async adminCreateUser(@Message() msg: IncomingMessage<Record<string, unknown> & { password: string; roles?: string[] }>) {
        const _user = this.requirePayload(msg.payload, "MISSING_INFO");

        const roles = _user?.roles as string[];
        delete _user.roles;

        try {
            const { _id, document } = await this.auth.signUp(_user, _user.password);

            if (roles?.length) await this.auth.addUserToRoles(_id, roles);
            this.eventEmitter.emit(UserCreatedEvent.EVENT_NAME, new UserCreatedEvent({ user: document as UserDocument, options: this.options }));
            return { ...msg.payload, _id };
        } catch (error) {
            throw toHttpException(error);
        }
    }

    @EndPoint({
        http: { method: "POST", path: "impersonate" },
        operation: "Impersonate User",
    })
    @Authorize({ by: "role", value: "super-admin" })
    public async impersonate(@Message() msg: IncomingMessage<{ sub: string }>) {
        //get current principle
        const principle = msg.principle;
        if (!principle) throw toHttpException(new AppError("Unauthorized", { code: "UNAUTHORIZED", status: HttpStatus.UNAUTHORIZED }));

        //if yes, get user by id
        const payload = this.requirePayload(msg.payload, "MISSING_INFO");
        const userDoc = await this.auth.findUserById(payload.sub);
        if (!userDoc) throw toHttpException(new AppError("Invalid user id", { code: "INVALID_USER_ID", status: HttpStatus.NOT_FOUND }));
        const user = userDoc.toObject() as User;
        if (!user) throw toHttpException(new AppError("Invalid user id", { code: "INVALID_USER_ID", status: HttpStatus.NOT_FOUND }));

        //add impersonate claim
        user.claims ??= {};
        user.claims.imps = principle.sub;

        return {
            access_token: await this.auth.issueAccessToken(user),
            refresh_token: await this.auth.issueRefreshToken(user, undefined, {
                imps: principle.sub,
            }),
        };
    }

    private async _doSignIn(msg: IncomingMessage<SigninRequest>): Promise<SigninResponse> {
        const payload = this.requirePayload(msg.payload, "INVALID_PAYLOAD");
        this.validateSigninRequest(payload);
        const grantType = payload.grant_type;
        switch (grantType) {
            case "password": {
                const passwordPayload = payload as PasswordSigninRequestGrant & { device?: UserDevice };
                const password = passwordPayload.password;
                const device = passwordPayload.device as UserDevice;

                let user: User | null = null;
                if ("id" in passwordPayload) user = await this.auth.signInUserByIdAndPassword(passwordPayload.id, password, device);
                else if ("username" in passwordPayload) user = await this.auth.signInUserByUsernameAndPassword(passwordPayload.username, password, device);
                else if ("email" in passwordPayload) user = await this.auth.signInUserByEmailAndPassword(passwordPayload.email, password, device);
                else if ("phone" in passwordPayload) user = await this.auth.signInUserByPhoneAndPassword(passwordPayload.phone, password, device);

                if (!user) throw toHttpException(new AppError("Invalid attempt", { code: AuthExceptions.INVALID_ATTEMPT, status: HttpStatus.BAD_REQUEST }));

                const result =
                    user.forceChangePwd === true
                        ? { reset_token: await this.auth.issueResetPasswordToken(user) }
                        : {
                              access_token: await this.auth.issueAccessToken(user),
                            refresh_token: await this.auth.issueRefreshToken(user, undefined, undefined, passwordPayload.device?.id),
                          };

                return result;
            }
            case "refresh": {
                const refreshPayload = payload as RefreshSigninRequestGrant & { device?: UserDevice };
                const token = (await this.auth.verifyToken(refreshPayload.refresh_token)) as { d?: string; claims?: Record<string, unknown> } | null;
                let user: User | null = null;
                if (token) {
                    user = await this.auth.signInUserByRefreshToken(refreshPayload.refresh_token);
                    if (token.d) {
                        const currentDevice = user.devices?.[token.d];
                        if (!currentDevice || currentDevice.active === false) throw toHttpException(new AppError("Invalid device", { code: "INVALID_DEVICE", status: HttpStatus.BAD_REQUEST }));
                    }
                } else if (msg.principle) {
                    try {
                        user = await this.auth.signInUserByPrinciple(msg.principle);
                    } catch (error) {
                        const authError = error as { code?: string };
                        if (authError.code == AuthExceptions.UserNotFound && msg.ctx.authProvider?.shouldCreateUser(msg.principle)) {
                            if (!msg.principle.email) {
                                throw toHttpException(new AppError("Invalid user data", { code: "INVALID_USER_DATA", status: HttpStatus.BAD_REQUEST }));
                            }
                            await this.auth.signUp({
                                email: msg.principle.email,
                                username: msg.principle.email,
                                external: {
                                    ...msg.principle,
                                    provider: msg.ctx.authProvider.constructor.name,
                                },
                            });
                            user = await this.auth.findUserByEmail(msg.principle.email);
                            if (!user) throw toHttpException(new AppError("User not found", { code: "USER_NOT_FOUND", status: HttpStatus.NOT_FOUND }));
                        } else throw error;
                    }
                } else throw toHttpException(new AppError("Invalid token", { code: "INVALID_TOKEN", status: HttpStatus.BAD_REQUEST }));

                const tokenClaims = token?.claims;
                const tokenDeviceId = token?.d;

                return {
                    access_token: await this.auth.issueAccessToken(user),
                    refresh_token: await this.auth.issueRefreshToken(user, undefined, tokenClaims, tokenDeviceId),
                };
            }
            //QUESTION: What if user deleted or wanted to change an api key?
            //there is no login with api key because api_key should never expire
            // case "api_key":
            // try {

            // } catch (error) {
            //   next(error);
            // }
            // break;
            default:
                throw toHttpException(new AppError("Invalid grant type", { code: AuthExceptions.InvalidGrantType, status: HttpStatus.BAD_REQUEST }));
        }
    }

    @Authorize({ by: "anonymous", access: "grant" })
    @EndPoint({ http: { method: "GET", path: "google/callback" } })
    async googleAuthRedirect(@Req() req: Request & { user?: { email?: string } }) {
        if (!req.user?.email) {
            throw toHttpException(new AppError("Invalid user data", { code: "INVALID_USER_DATA", status: HttpStatus.BAD_REQUEST }));
        }
        const user = await this.auth.findUserByEmail(req.user.email);
        if (!user) {
            throw toHttpException(new AppError("User not found", { code: "USER_NOT_FOUND", status: HttpStatus.NOT_FOUND }));
        }
        const access_token = await this.auth.issueAccessToken(user);
        const refresh_token = await this.auth.issueRefreshToken(user);
        const clientUrl = this.auth.options.externalAuth?.google?.client_url ?? "";
        return {
            url: `${clientUrl}/login?access_token=${access_token}&refresh_token=${refresh_token}`,
        };
    }

    @Authorize({ by: "anonymous", access: "grant" })
    @EndPoint({
        http: { method: "POST", path: "google-auth" },
        operation: "Auth with google",
    })
    async clientExternalAuth(@Body() req: SocialAuthRequest): Promise<TokenPairResponse> {
        const googleUser = await verifyGoogleUser(this.getSocialToken(req));
        if (!googleUser) {
            // maybe check if the user had been registered using google, the lock the user account or delete it.
            throw toHttpException(new AppError("Invalid token", { code: "INVALID_TOKEN", status: HttpStatus.BAD_REQUEST }));
        }

        if (!googleUser.email) {
            throw toHttpException(new AppError("Invalid user data", { code: "INVALID_USER_DATA", status: HttpStatus.BAD_REQUEST }));
        }
        let userRecord = (await this.auth.findUserByEmail(googleUser.email)) as unknown as User | null;

        const GOOGLE_CLIENT_REGISTRATION_ENABLED = (process.env.GOOGLE_CLIENT_REGISTRATION_ENABLED || "false").toLowerCase() === "true";

        if (!userRecord) {
            if (GOOGLE_CLIENT_REGISTRATION_ENABLED !== true) throw toHttpException(new AppError("User not found", { code: "USER_NOT_FOUND", status: HttpStatus.NOT_FOUND }));
            const user = {
                hd: googleUser.hd,
                email: googleUser.email,
                username: googleUser.email,
                emailVerified: googleUser.email_verified,
                name: googleUser.name,
                picture: googleUser.picture,
                given_name: googleUser.given_name,
                family_name: googleUser.family_name,
                locale: googleUser.locale,
                language: googleUser.locale,
            } as unknown as User;
            const external = {} as Record<string, unknown>;
            try {
                const { document: res } = await this.auth.signUp(
                    {
                        ...user,
                        external: { ...external, ["google"]: googleUser.sub },
                    } as User,
                    "",
                );
                if (!res?.email) throw toHttpException(new AppError("User not found", { code: "USER_NOT_FOUND", status: HttpStatus.NOT_FOUND }));
                userRecord = (await this.auth.findUserByEmail(res.email)) as unknown as User | null;
            } catch (error) {
                throw toHttpException(error);
            }
        }

        if (!userRecord) {
            throw toHttpException(new AppError("User not found", { code: "USER_NOT_FOUND", status: HttpStatus.NOT_FOUND }));
        }

        const access_token = await this.auth.issueAccessToken(userRecord);
        const refresh_token = await this.auth.issueRefreshToken(userRecord);
        return { access_token, refresh_token };
    }

    @Authorize({ by: "anonymous", access: "grant" })
    @EndPoint({
        http: { method: "POST", path: "facebook-auth" },
        operation: "Auth with Facebook",
    })
    async facebookClientExternalAuth(@Body() req: SocialAuthRequest): Promise<TokenPairResponse> {
        return this.handleFacebookClientExternalAuth(req);
    }

    private async handleFacebookClientExternalAuth(req: SocialAuthRequest): Promise<TokenPairResponse> {
        const providerToken = this.getSocialToken(req);

        // const fbuser = await this.http.get("https://graph.facebook.com/v1.0" + "/me?fields=id,name,email" + "&access_token=" + providerToken);
        const fbuser = await fetch("https://graph.facebook.com/v1.0/me?fields=id,name,email&access_token=" + providerToken).then((res) => res.json());
        // const inspectToken = await this.http.get("https://graph.facebook.com/debug_token?" + "input_token=" + providerToken + "&access_token=" + process.env.FACEBOOK_APP_TOKEN);
        const inspectToken = await fetch("https://graph.facebook.com/debug_token?input_token=" + providerToken + "&access_token=" + process.env.FACEBOOK_APP_TOKEN).then((res) =>
            res.json(),
        );
        // verifying the user token was issued by our app
        if (inspectToken.status !== 200) throw toHttpException(new AppError("Invalid token", { code: "INVALID_TOKEN", status: HttpStatus.BAD_REQUEST }));
        const user = {
            username: fbuser.data.email,
            email: fbuser.data.email,
            name: fbuser.data.name,
        };
        let userRecord = (await this.auth.findUserByEmail(fbuser.data.email)) as User | UserDocument | null;
        if (!userRecord) {
            const facebook_client_regeneration_enabled = (process.env.FACEBOOK_CLIENT_REGENERATION_ENABLED || "false").toLowerCase() === "true";
            if (facebook_client_regeneration_enabled === true) {
                await this.auth.signUp(
                    {
                        ...user,
                        external: { ["facebook"]: fbuser.data.email },
                    } as unknown as User,
                    "",
                );
                userRecord = await this.auth.findUserByEmail(fbuser.data.email);
            } else {
                userRecord = { _id: fbuser.data.email, ...user } as unknown as User;
            }
        }

        if (!userRecord) {
            throw toHttpException(new AppError("User not found", { code: "USER_NOT_FOUND", status: HttpStatus.NOT_FOUND }));
        }

        const access_token = await this.auth.issueAccessToken(userRecord);
        const refresh_token = await this.auth.issueRefreshToken(userRecord);
        return { access_token, refresh_token };
    }

    @Get("/facebook/redirect")
    @Redirect("https://nestjs.com", 301)
    @UseGuards(AuthGuard("facebook"))
    async facebookLoginRedirect(@Req() req: Request) {
        const { user } = req as Request & { user: User };
        if (!user) throw toHttpException(new AppError("Invalid token", { code: "INVALID_TOKEN", status: HttpStatus.BAD_REQUEST }));
        const access_token = await this.auth.issueAccessToken(user);
        const refresh_token = await this.auth.issueRefreshToken(user);
        const clientUrl = this.auth.options.externalAuth?.facebook?.client_url ?? "";
        return {
            url: `${clientUrl}/login?access_token=${access_token}&refresh_token=${refresh_token}`,
        };
    }

    @Authorize({ by: "anonymous", access: "grant" })
    @EndPoint({ http: { method: "POST", path: "" }, operation: "Login" })
    public async signIn(@Res() res: { send: (body: unknown) => void; cookie?: (name: string, value: string, options?: unknown) => void }, @Message() msg: IncomingMessage<SigninRequest>) {
        const grantType = msg?.payload?.grant_type ?? "unknown";
        try {
            if (!msg?.payload) {
                throw toHttpException(new AppError("Invalid payload", { code: "INVALID_PAYLOAD", status: HttpStatus.BAD_REQUEST }));
            }
            const signin = await this._doSignIn(msg);
            if ("reset_token" in signin) {
                logger.info({ event: "auth.signin.reset-token-issued", grantType });
                res.send({ reset_token: signin.reset_token });
                return;
            }
            const { access_token, refresh_token } = signin;
            const { useCookies } = this.auth.options;
            if (useCookies?.enabled === true) {
                res.cookie?.(useCookies.cookieName, JSON.stringify({ access_token, refresh_token }), useCookies.options);
            }
            logger.info({ event: "auth.signin.success", grantType });
            res.send({ access_token, refresh_token });
        } catch (error) {
            logger.info({
                event: "auth.signin.failed",
                grantType,
                code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
            });
            if (error instanceof AppError) {
                throw toHttpException(error);
            }
            throw toHttpException(error);
        }
    }

    @Authorize({ by: "user", access: "grant" })
    @EndPoint({ http: { method: "GET", path: "signout" }, operation: "Sign out" })
    public async signOut(
        @Res() res: { send: (body: unknown) => void; clearCookie?: (name: string, options?: unknown) => void },
        @Message() msg: IncomingMessage<unknown>,
    ) {
        const principle = msg.principle;
        if (!principle?.sub) {
            throw toHttpException(new AppError("Unauthorized", { code: "UNAUTHORIZED", status: HttpStatus.UNAUTHORIZED }));
        }

        await this.auth.signOut({ _id: principle.sub });
        const { useCookies } = this.auth.options;
        if (useCookies?.enabled === true) {
            res.clearCookie?.(useCookies.cookieName, useCookies.options);
        }
        logger.info({ event: "auth.signout.success", userId: principle.sub });
        res.send({ success: true, message: "Logout successful" });
    }

    @EndPoint({ http: { method: "POST", path: "signup" }, operation: "Sign up" })
    @Authorize({ by: "anonymous", access: "grant" })
    public async signup(@Message() msg: IncomingMessage<User & { password: string }>) {
        try {
            const _user = this.requirePayload(msg.payload, "MISSING_INFO");
            const user_errors = validateUser(_user);
            if (user_errors.length) {
                throw toHttpException(new AppError("User validation failed", { code: "USER_VALIDATION_FAILED", status: HttpStatus.BAD_REQUEST, details: user_errors }));
            }
            const { document: user } = await this.auth.signUp(_user, _user.password);
            if (!user) throw toHttpException(new AppError("Invalid operation", { code: "INVALID_OPERATION", status: HttpStatus.BAD_REQUEST }));
            const responseUser = { ...(user as Record<string, unknown>) } as Record<string, unknown> & { passwordHash?: string };
            delete responseUser.passwordHash;

            this.eventEmitter.emit(UserSignedUpEvent.EVENT_NAME, new UserSignedUpEvent({ user, options: this.options }));
            return responseUser;
        } catch (error) {
            logger.error("", error);
            throw toHttpException(error);
        }
    }

    @EndPoint({ http: { method: "POST", path: "lock" }, operation: "Lock User" })
    @Authorize({ by: "role", value: "super-admin" })
    public async lock(@Message() msg: IncomingMessage<{ id: string; lock: string | boolean }>) {
        const payload = this.requirePayload(msg.payload, "MISSING_INFO");
        const id = payload.id;
        if (!id) {
            throw toHttpException(new AppError("Missing id value", { code: "MISSING_ID_VALUE", status: HttpStatus.BAD_REQUEST }));
        }

        let lock: boolean;
        if (payload.lock === "true" || payload.lock === true) lock = true;
        else if (payload.lock === "false" || payload.lock === false) lock = false;
        else {
            throw toHttpException(new AppError("Invalid lock value", { code: "INVALID_LOCK_VALUE", status: HttpStatus.BAD_REQUEST }));
        }

        const user = await this.auth.model.findById(id);
        if (user) {
            user.disabled = lock;
            await user.save();
            return { document: user };
        } else throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));
    }

    @Authorize({ by: "anonymous", access: "grant" })
    @EndPoint({
        http: { method: "POST", path: "check-user" },
        operation: "Check User",
    })
    async checkUser(@Message() msg: IncomingMessage<{ usernameOrEmailOrPhone: string }>) {
        const payload = this.requirePayload(msg.payload, "MISSING_ARGUMENTS");
        const { usernameOrEmailOrPhone } = payload;
        if (!usernameOrEmailOrPhone) throw toHttpException(new AppError("Missing arguments", { code: "MISSING_ARGUMENTS", status: HttpStatus.BAD_REQUEST }));

        let user = await this.auth.findUserByEmail(usernameOrEmailOrPhone);
        if (!user) user = await this.auth.findUserByUsername(usernameOrEmailOrPhone);
        if (!user) user = await this.auth.findUserByPhone(usernameOrEmailOrPhone);
        if (!user) throw toHttpException(new AppError("Invalid user", { code: "INVALID_USER", status: HttpStatus.BAD_REQUEST }));
        if (user.disabled) return { requiresPassword: true, canLogin: false, requires2FA: false };
        return { requiresPassword: true, canLogin: true, requires2FA: false };
    }

    @EndPoint({
        http: { method: "POST", path: "verify/send" },
        operation: "Send Verification",
    })
    @Authorize({ by: "anonymous" })
    public async sendVerification(
        @Message()
        msg: IncomingMessage<{ id: string; name: string; value: string }>,
    ) {
        const payload = this.requirePayload(msg.payload, "INVALID_ARGUMENTS");
        const name = this.parseVerificationTargetName(payload.name);
        const value = (payload.value ?? "").trim();
        if (!name || !value) throw toHttpException(new AppError("Invalid arguments", { code: "INVALID_ARGUMENTS", status: HttpStatus.BAD_REQUEST }));

        const principle = msg.principle;
        const id = payload.id ?? principle?.sub;

        //query user
        const user = await this.getUser(name, value, id);
        if (!user) throw toHttpException(new AppError("Can not find user", { code: "USER_NOT_FOUND", status: HttpStatus.NOT_FOUND }));
        if (user.disabled) throw toHttpException(new AppError("User disabled", { code: AuthExceptions.UserDisabled, status: HttpStatus.FORBIDDEN }));

        let verification = user.get(`${name}Verification`);
        const now = new Date().getTime();
        const hasActiveVerification = Boolean(verification && now <= verification.issuedAt + UsersController.VERIFY_WINDOW_MS);

        if (hasActiveVerification) {
            if (verification.sendAttempts >= UsersController.VERIFY_MAX_SEND_ATTEMPTS) {
                logger.info({ event: "auth.verify.send.blocked", reason: "max-send-attempts", name, userId: String(user._id) });
                throw toHttpException(new AppError("Too many attempts", { code: AuthExceptions.TooManyAttempts, status: HttpStatus.TOO_MANY_REQUESTS }));
            }

            if (verification.lastSend && now - verification.lastSend < UsersController.VERIFY_RESEND_COOLDOWN_MS) {
                logger.info({ event: "auth.verify.send.blocked", reason: "cooldown", name, userId: String(user._id) });
                throw toHttpException(new AppError("Already sent", { code: "ALREADY_SENT", status: HttpStatus.BAD_REQUEST }));
            }
        }

        if (!hasActiveVerification) {
            const r = await this.auth.issueVerifyToken(user, name, value, 0);
            verification = r.verification;
        }

        try {
            verification = {
                ...verification,
                lastSend: now,
                sendAttempts: verification.sendAttempts + 1,
            };
            user.set(`${name}Verification`, verification);
            await user.save();
            logger.info({ event: "auth.verify.send.success", name, userId: String(user._id), sendAttempts: verification.sendAttempts });
            this.eventEmitter.emit(UserSendVerificationEvent.EVENT_NAME, new UserSendVerificationEvent({ user, verification, options: this.options }));
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async getUser(name: string, value: string, id?: string): Promise<UserDocument | null> {
        if (!value && id) return this.auth.findUserById(id);

        switch (name) {
            case "email":
                return this.auth.findUserByEmail(value);
            case "phone":
                return this.auth.findUserByPhone(value);
            default:
                if (id) return this.auth.findUserById(id);
                break;
        }
        return null;
    }

    @EndPoint({ http: { method: "POST", path: "verify" }, operation: "Verify" })
    @Authorize({ by: "anonymous" })
    public async verify(
        @Message()
        msg: IncomingMessage<{
            id: string;
            name: string;
            value: string;
            token: string;
            type: string;
        }>,
    ) {
        try {
            const payload = this.requirePayload(msg.payload, "INVALID_ARGS");
            const u = msg.principle;
            const name = this.parseVerificationTargetName(payload.name); // email | phone
            const value = (payload.value || "").trim();
            const type = (payload.type || "").trim();
            let token = (payload.token || "").trim();
            if (type !== "code" && type !== "token") {
                throw toHttpException(new AppError("Invalid args", { code: "INVALID_ARGS", status: HttpStatus.BAD_REQUEST }));
            }
            if (!token) {
                throw toHttpException(new AppError("Invalid token", { code: "INVALID_TOKEN", status: HttpStatus.BAD_REQUEST }));
            }
            if (type === "code" && (!name || !value)) throw toHttpException(new AppError("Invalid args", { code: "INVALID_ARGS", status: HttpStatus.BAD_REQUEST }));
            //When type is token then all we need is to verify that token and update the user properly

            const user = await this.getUser(name, value, payload.id || u?.sub);
            if (!user) throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));
            if (user.disabled) throw toHttpException(new AppError("User disabled", { code: AuthExceptions.UserDisabled, status: HttpStatus.FORBIDDEN }));

            await this.auth.verify(user, name, payload.token, value);

            token = await this.auth.issueGenericToken({
                t: TokenTypes.verify,
                [name]: value,
            });
            return { token };
        } catch (error) {
            //todo: error msg
            logger.log(error);
            throw toHttpException(error);
        }
    }

    @EndPoint({
        http: { method: "POST", path: "device" },
        operation: "Add Device",
    })
    @Authorize({ by: "role", value: "super-admin" })
    public async updateDevice(@Message() msg: IncomingMessage<UserDevice>) {
        const principal = msg.principle;
        if (!principal) throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));

        const device = this.requirePayload(msg.payload, "INVALID_DEVICE");
        if (!device.id) throw toHttpException(new AppError("Invalid device", { code: "INVALID_DEVICE", status: HttpStatus.BAD_REQUEST }));

        const user = await this.auth.findUserById(principal.sub);
        if (!user) throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));
        const devices = user.devices;

        if (!devices?.[device.id]) throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));
        devices[device.id] = { ...devices?.[device.id], ...device };
        await user.updateOne({
            $set: {
                devices: devices,
            },
        });
    }

    @EndPoint({
        http: { method: "DELETE", path: "device" },
        operation: "Remove Device",
    })
    @Authorize({ by: "role", value: "super-admin" })
    public async removeDevice(@Message() msg: IncomingMessage<UserDevice>) {
        const principal = msg.principle;
        if (!principal) throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));

        const deviceId = msg.query?.id as string;
        if (!deviceId) throw toHttpException(new AppError("Invalid device", { code: "INVALID_DEVICE", status: HttpStatus.BAD_REQUEST }));

        const user = await this.auth.findUserById(principal.sub);
        if (!user) throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));
        const devices = user.devices;

        if (!devices?.[deviceId]) throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));

        delete devices[deviceId];

        await user.updateOne({
            $set: {
                devices: devices,
            },
        });

        return "OK";
    }

    @EndPoint({ http: { method: "GET", path: "whoami" }, operation: "Who am I" })
    @Authorize({ by: "anonymous" })
    public async whoami(@Message() msg: IncomingMessage) {
        return msg.principle ?? {};
    }

    @OnEvent("user.*")
    logUserEvents(payload: unknown) {
        const logPayload = typeof payload === "object" && payload && "toLogPayload" in payload && typeof payload.toLogPayload === "function"
            ? payload.toLogPayload()
            : { event: "user.unknown" };
        logger.info(logPayload);
    }

    private getSocialToken(req: SocialAuthRequest): string {
        const providerToken = req?.access_token ?? req?.token;
        if (!providerToken || typeof providerToken !== "string" || providerToken.trim().length === 0) {
            throw toHttpException(new AppError("Invalid token", { code: "INVALID_TOKEN", status: HttpStatus.BAD_REQUEST }));
        }
        return providerToken;
    }

    private parseVerificationTargetName(rawName: unknown): "email" | "phone" {
        const name = typeof rawName === "string" ? rawName.trim() : "";
        if (UsersController.ALLOWED_VERIFY_TARGETS.has(name)) {
            return name as "email" | "phone";
        }
        throw toHttpException(new AppError("Invalid arguments", { code: "INVALID_ARGUMENTS", status: HttpStatus.BAD_REQUEST }));
    }

    private validateSigninRequest(payload: SigninRequest): void {
        if (!payload || typeof payload !== "object") {
            throw toHttpException(new AppError("Invalid payload", { code: "INVALID_PAYLOAD", status: HttpStatus.BAD_REQUEST }));
        }

        if (!payload.grant_type || typeof payload.grant_type !== "string") {
            throw toHttpException(new AppError("Invalid grant type", { code: AuthExceptions.InvalidGrantType, status: HttpStatus.BAD_REQUEST }));
        }

        if (payload.grant_type === "password") {
            const hasIdentifier = "id" in payload || "username" in payload || "email" in payload || "phone" in payload;
            if (!hasIdentifier) {
                throw toHttpException(new AppError("Missing user identifier", { code: "MISSING_USER_IDENTIFIER", status: HttpStatus.BAD_REQUEST }));
            }
            if (!payload.password && !("id" in payload)) {
                throw toHttpException(new AppError("Invalid password", { code: "INVALID_PASSWORD", status: HttpStatus.BAD_REQUEST }));
            }
            return;
        }

        if (payload.grant_type === "refresh") {
            if (!("refresh_token" in payload) || !payload.refresh_token || typeof payload.refresh_token !== "string") {
                throw toHttpException(new AppError("Invalid refresh token", { code: "INVALID_TOKEN", status: HttpStatus.BAD_REQUEST }));
            }
            return;
        }

        throw toHttpException(new AppError("Invalid grant type", { code: AuthExceptions.InvalidGrantType, status: HttpStatus.BAD_REQUEST }));
    }

    private requirePayload<T>(payload: T | undefined, code = "INVALID_PAYLOAD"): T {
        if (!payload) {
            throw toHttpException(new AppError("Invalid payload", { code, status: HttpStatus.BAD_REQUEST }));
        }
        return payload;
    }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET); // TODO: verify user tokens signed in using google auth on client side
async function verifyGoogleUser(token: string): Promise<TokenPayload | undefined> {
    try {
        // client.verifySignedJwtWithCerts()
        const ticket = await client.verifyIdToken({ idToken: token });
        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        logger.error(error);
    }
}
