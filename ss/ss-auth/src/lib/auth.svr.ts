import { hash, compare } from "bcryptjs";
const bcrypt = { hash, compare };
import mongoose from "mongoose";

import { DataService, WriteResult } from "@ss/data";
import { AuthExceptions } from "./auth-exception";
import { Inject, Injectable } from "@nestjs/common";
import { AuthOptions } from "./auth-options";
import { logger } from "./logger";

import { User, randomString, UserDevice, Principle } from "@noah-ark/common";
import { UserDocument } from "./user.document";
import { ObjectId } from "mongodb";
import { AppError, sha256 } from "@ss/common";
import { TokenService } from "./token.service";
import { SessionService } from "./session.service";
import { VerificationService } from "./verification.service";

export type SignOptions = {
    issuer?: string;
    expiresIn: string | number;
    audience?: string;
    subject?: string;
};

export type Verification = {
    code: string;
    expire: number;
    issuedAt: number;
    attempts: number;
    sendAttempts: number;
    lastSend?: number;
};

export enum TokenTypes {
    access = "acc",
    refresh = "rfs",
    reset = "rst",
    verify = "vfy",
}

export type TokenBase = { t: TokenTypes } & Record<string, unknown>;

@Injectable()
export class AuthService {
    #secret: Uint8Array;
    model!: mongoose.Model<UserDocument>;

    constructor(
        @Inject("DB_AUTH") public readonly data: DataService,
        @Inject("AUTH_OPTIONS") public readonly options: AuthOptions,
        private readonly tokenService: TokenService,
        private readonly sessionService: SessionService,
        private readonly verificationService: VerificationService,
    ) {
        this.#secret = new TextEncoder().encode(this.options.secret);
        this.getModel();
    }

    private async getModel(): Promise<void> {
        const model = await this.data.getModel("user");
        if (!model) throw new AppError("User model not found", { code: AuthExceptions.InvalidOperation });
        this.model = model as unknown as mongoose.Model<UserDocument>;
    }
    async signUp<KeyType extends string | ObjectId = string>(user: Partial<User<KeyType>>, password?: string): Promise<WriteResult<User>> {
        const payload = { ...user } as Record<string, unknown>;

        if (password) payload.passwordHash = await bcrypt.hash(password, 10);

        delete payload["password"];
        payload.securityCode = randomString(5);

        try {
            return this.data.post("user", payload);
        } catch (err) {
            const message = err instanceof Error ? err.message : AuthExceptions.InvalidSignup;
            throw new AppError(message, { code: AuthExceptions.InvalidSignup });
        }
    }

    async verifyToken(token: string): Promise<TokenBase> {
        return this.tokenService.verifyToken(this.#secret, token) as Promise<TokenBase>;
    }

    async sign(payload: TokenBase, options: SignOptions): Promise<string> {
        return this.tokenService.sign(this.#secret, this.options.issuer, payload, options);
    }

    async changeUserToRoles(userId: string, roles: string[]) {
        if (!userId) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });
        const user = await this.findUserById(userId);
        if (!user) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });

        const rs = roles ?? [];
        await this.data.patch(`/user/${user.id}`, [{ op: "replace", path: "/roles", value: rs }], user);

        return userId;
    }

    async addUserToRoles(userId: string, roles: string[]) {
        if (!userId) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });
        const user = await this.findUserById(userId);
        if (!user) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });

        const rs = (user.roles || []).concat(roles.filter((r) => user.roles?.indexOf(r) < 0));
        if (!roles || roles.length === 0) throw new AppError("Invalid roles data", { code: AuthExceptions.InvalidRolesData });
        await this.data.patch(`/user/${user.id}`, [{ op: "replace", path: "/roles", value: rs }], user);

        return userId;
    }

    async removeUserRoles(userId: string, roles: string[]) {
        if (!userId) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });
        const user = await this.findUserById(userId);
        if (!user) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });

        if (!roles || roles.length === 0) throw new AppError("Invalid roles data", { code: AuthExceptions.InvalidRolesData });
        const rs = (user.roles || []).filter((r) => roles.indexOf(r) === -1);
        await this.data.patch(`/user/${user.id}`, [{ op: "replace", path: "/roles", value: rs }], user);

        return userId;
    }

    async issueGenericToken(payload: TokenBase, expiresIn = "7 days"): Promise<string> {
        return this.tokenService.issueGenericToken(this.#secret, this.options.issuer, payload, expiresIn);
    }

    async issueAccessToken(user: User, options?: SignOptions, additionalClaims?: Record<string, unknown>): Promise<string> {
        if (!user) {
            throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });
        }

        const payload: TokenBase = {
            t: TokenTypes.access,
            sec: user.securityCode,
            email: user.email,
        };

        if (user.phone) payload.phone = user.phone;
        if (user.roles?.length) payload.roles = Array.from(user.roles as string[]);
        if (user.emailVerified === true) payload.emv = 1;
        if (user.phoneVerified === true) payload.phv = 1;

        if (user.name?.trim().length) payload.name = user.name;
        if (user.language?.trim().length) payload.language = user.language;

        const claims = { ...user.claims, ...additionalClaims };
        if (Object.keys(claims).length) payload.claims = claims;

        const sub = this.getSubject(user);

        const signOptions: SignOptions = {
            subject: sub,
            expiresIn: this.options.accessTokenExpiry || "20m",
            ...options,
        };

        if (!signOptions.issuer) signOptions.issuer = this.options.issuer ?? "ss";

        return this.sign(payload, signOptions);
    }

    async issueRefreshToken(user: User, options?: SignOptions, additionalClaims?: Record<string, unknown>, device?: string) {
        if (!user) {
            throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });
        }
        const payload: TokenBase = {
            t: TokenTypes.refresh,
            sec: user.securityCode,
        };
        if (additionalClaims) payload.claims = additionalClaims;
        const sub = this.getSubject(user);

        const signOptions: SignOptions = {
            subject: sub,
            expiresIn: this.options.refreshTokenExpiry || "20m",
            ...options,
        };
        if (!signOptions.issuer) signOptions.issuer = this.options.issuer ?? "ss";
        if (device) payload.d = device;
        return this.sign(payload, signOptions);
    }

    async issueResetPasswordToken(user: User, options?: SignOptions) {
        if (!user) throw new AppError("Invalid user data", { code: AuthExceptions.InvalidUserData });

        const payload: TokenBase = { t: TokenTypes.reset, sec: user.securityCode };
        const sub = this.getSubject(user);

        const signOptions: SignOptions = {
            subject: sub,
            expiresIn: this.options.resetTokenExpiry || "20m",
            ...options,
        };
        if (!signOptions.issuer) signOptions.issuer = this.options.issuer ?? "ss";
        return this.sign(payload, signOptions);
    }

    async issueVerifyToken(
        user: UserDocument,
        name = "email",
        value: string,
        sendAttempts?: number,
        options?: SignOptions,
    ): Promise<{ token: string; verification: Verification }> {
        return this.verificationService.issueVerifyToken(
            user,
            name,
            value,
            sendAttempts,
            options,
            String(this.options.verifyTokenExpiry || "20m"),
            this.options.issuer ?? "ss",
            (payload, signOptions) => this.sign(payload as TokenBase, signOptions),
        ) as Promise<{ token: string; verification: Verification }>;
    }

    async removeVerifyToken(user: UserDocument, name: string) {
        return this.verificationService.removeVerifyToken(user, name);
    }

    async generateApiKey(user: UserDocument, name: string, principle: unknown) {
        const key = randomString(20);
        const secret = randomString(20);
        const secrethash = sha256(key + secret).toString("base64");

        await this.model.create({
            _id: new mongoose.Types.ObjectId(),
            userId: user._id,
            name,
            key,
            secrethash,
            principle,
        });

        return key + ":" + secret;
    }

    async findUserById(id: string): Promise<UserDocument | null> {
        return this.model.findOne({ _id: id });
    }
    async findUserByUsername(username: string): Promise<UserDocument | null> {
        return this.model.findOne({ username });
    }
    async findUserByEmail(email: string): Promise<UserDocument | null> {
        return this.model.findOne({ email });
    }
    async findUserByPhone(phone: string): Promise<UserDocument | null> {
        return this.model.findOne({ phone });
    }

    async signInUserByUsernameAndPassword(username: string, password: string, device: UserDevice): Promise<UserDocument> {
        return this.sessionService.signInUserByIdentifier(() => this.findUserByUsername(username), password, device, (user, nextPassword, registerAttempt, nextDevice) =>
            this.signInUser(user, nextPassword ?? undefined, registerAttempt, nextDevice ?? undefined),
        );
    }
    async signInUserByEmailAndPassword(email: string, password: string, device: UserDevice): Promise<UserDocument> {
        return this.sessionService.signInUserByIdentifier(() => this.findUserByEmail(email), password, device, (user, nextPassword, registerAttempt, nextDevice) =>
            this.signInUser(user, nextPassword ?? undefined, registerAttempt, nextDevice ?? undefined),
        );
    }
    async signInUserByPhoneAndPassword(phone: string, password: string, device: UserDevice): Promise<UserDocument> {
        return this.sessionService.signInUserByIdentifier(() => this.findUserByPhone(phone), password, device, (user, nextPassword, registerAttempt, nextDevice) =>
            this.signInUser(user, nextPassword ?? undefined, registerAttempt, nextDevice ?? undefined),
        );
    }

    async signInUserByIdAndPassword(id: string, password: string | undefined, device: UserDevice): Promise<UserDocument> {
        return this.sessionService.signInUserByIdAndPassword(
            (userId) => this.findUserById(userId),
            (user) => this._registerFailedAttempt(user),
            (user, nextPassword, registerAttempt, nextDevice) => this.signInUser(user, nextPassword ?? undefined, registerAttempt, nextDevice ?? undefined),
            id,
            password,
            device,
        );
    }

    async signInUserByRefreshToken(refreshToken: string): Promise<UserDocument> {
        return this.sessionService.signInUserByRefreshToken(
            (token) => this.verifyToken(token),
            (id) => this.findUserById(id),
            (user, password, registerAttempt, device) => this.signInUser(user, password ?? undefined, registerAttempt, device ?? undefined),
            refreshToken,
        );
    }

    async signInUserByPrinciple(principle: Principle, key: keyof User = "email"): Promise<UserDocument> {
        return this.sessionService.signInUserByPrinciple(
            (searchKey, value) => this.model.findOne({ [searchKey]: value }),
            (user, password, registerAttempt, device) => this.signInUser(user, password ?? undefined, registerAttempt, device ?? undefined),
            principle,
            key,
        );
    }

    async signInUser(user: UserDocument, password?: string, registerAttempt = true, device?: UserDevice) {
        return this.sessionService.signInUser(
            user,
            password,
            registerAttempt,
            device,
            (sessionUser, sessionDevice) => this._registerSuccessLoginAttempt(sessionUser, sessionDevice as UserDevice | undefined),
            (sessionUser) => this._registerFailedAttempt(sessionUser),
            (message, error) => logger.error(message, error),
        );
    }

    async signOut(user: User | Pick<User, "_id">): Promise<void> {
        const userId = String(user._id);
        logger.info({ event: "auth.signout.invalidate.start", userId });
        try {
            await this.sessionService.signOut(this.model, user, randomString(5));
            logger.info({ event: "auth.signout.invalidate.success", userId });
        } catch (error) {
            logger.error("auth.signout.invalidate.failed", error);
            throw error;
        }
    }

    async resetPassword(resetToken: string, newPassword: string, forceChange = false) {
        return this.verificationService.resetPassword(this.model, resetToken, newPassword, forceChange, (token) => this.verifyToken(token));
    }

    async changeUserPassword(id: string, newPassword: string) {
        return this.verificationService.changeUserPassword((userId) => this.findUserById(userId), id, newPassword);
    }

    async changePassword(id: string, password: string, newPassword: string) {
        return this.verificationService.changePassword((userId) => this.findUserById(userId), id, password, newPassword);
    }

    async verify(user: UserDocument, name: string, verifyToken: string, value?: string): Promise<boolean> {
        return this.verificationService.verify(user, name, verifyToken, value, (token) => this.verifyToken(token));
    }

    private _registerFailedAttempt(user: UserDocument) {
        user.attempts = user.attempts + 1;
        user.lastAttempt = new Date();
        return user.updateOne({
            $set: {
                attempts: user.attempts,
                lastAttempt: user.lastAttempt,
            },
        });
    }
    private async _registerSuccessLoginAttempt(user: UserDocument, device?: string | UserDevice) {
        const devices = user.devices ?? {};
        if (device) {
            const deviceId = typeof device === "string" ? device : device.id;
            const currentDevice = devices[deviceId];
            devices[deviceId] =
                typeof device === "string"
                    ? ({
                          ...currentDevice,
                          ...{ active: true, lastActive: new Date() },
                      } as UserDevice)
                    : ({
                          ...currentDevice,
                          ...device,
                          ...{ active: true, lastActive: new Date() },
                      } as UserDevice);
        }
        return user.updateOne({
            $set: {
                attempts: 0,
                lastAttempt: undefined,
                lastLogin: new Date(),
                devices,
            },
        });
    }
    private _validateAttempt(user: UserDocument): boolean {
        const now = Date.now();
        if (user.lastAttempt && now - +user.lastAttempt > this.options.maximumAllowedLoginAttemptsExpiry) {
            user.attempts = 0;
            user.lastAttempt = undefined;
        }

        return user.attempts < this.options.maximumAllowedLoginAttempts;
    }

    private getSubject(user: User): string {
        const maybeObjectId = user._id as unknown as { toHexString?: () => string };
        if (typeof maybeObjectId?.toHexString === "function") return maybeObjectId.toHexString();
        return String(user._id);
    }
}
