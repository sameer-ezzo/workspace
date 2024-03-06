
import { GetPublicKeyOrSecret, verify } from "jsonwebtoken"
import jwksClient, { RsaSigningKey } from 'jwks-rsa';
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common"


import FusionAuthClient, { ApplicationResponse, IdentityProviderStartLoginResponse, IdentityProviderType, RegistrationResponse, User } from '@fusionauth/typescript-client'
import { SignInPayload, SignInResponse, SignupResponse } from "./fusion-auth-api.svr";
import { AuthOptions } from "./auth-options";
import { HttpService } from "@nestjs/axios";
import { AuthException, AuthExceptions } from "./auth-exception";
import { firstValueFrom } from "rxjs";
import { logger } from "@ss/common";
import ClientResponse from "@fusionauth/typescript-client/build/src/ClientResponse";


@Injectable()
export class FusionAuthService {


    private readonly baseUrl = `${this.options.fusionAuthApiBase}/api`;
    constructor(
        @Inject('AUTH_OPTIONS') public readonly options: AuthOptions,
        private readonly http: HttpService) {
        const errors = AuthOptions.getErrors(this.options)
        if (errors) throw new Error('Invalid fusion auth options, ' + errors.join(', '))
    }

    async getOAuth2Info(applicationId: any): Promise<ApplicationResponse> {
        const fusion = new FusionAuthClient(this.options.fusionAuthApiKey, this.options.fusionAuthURL, this.options.tenantIds)
        return fusion.retrieveApplication(applicationId).then(r => r.response)
    }





    private readonly tenantHeader = (tenantId: string) => ({ 'X-FusionAuth-TenantId': tenantId })


    async getTenantSettings(): Promise<any> {
        const result = await firstValueFrom(this.http.get(`${this.baseUrl}/api/tenant`)).then(r => r.data)
        return result.data
    }

    async signUp(user: Partial<User> & { appId?: string; },
        password: string,
        passwordChangeRequired: boolean = false): Promise<SignupResponse> {
        const applicationId = user.appId;
        if (!applicationId) throw new AuthException(AuthExceptions.INVALID_APPLICATION_ID);

        try {
            const postUrl = user.id ? `${this.baseUrl}/api/user/${user.id}` : `${this.baseUrl}/api/user`;
            const body = {
                applicationId,
                sendSetPasswordEmail: false,
                skipVerification: true,
                user: { ...user, passwordChangeRequired, password }
            }

            const result = await firstValueFrom(this.http.post(postUrl, body, {
                headers: { ...this.tenantHeader(this.options.tenantIds) }
            })
            ).then(r => r.data)

            return { ...result, id: result.user.id } as SignupResponse
        } catch (error) {
            const { message, status } = error
            logger.error('signUp Error:', status, message)
            throw new HttpException(message ?? error, status ?? HttpStatus.BAD_REQUEST)
        }
    }

    async signIn(payload: SignInPayload, x_Forwarded_For?: string): Promise<SignInResponse> {
        const applicationId = payload.appId;
        console.log('applicationId', applicationId)
        if (!applicationId) throw new AuthException(AuthExceptions.INVALID_APPLICATION_ID);

        try {
            const postUrl = `${this.baseUrl}/api/login`;
            const body = {
                ...payload,
                applicationId,
                ipAddress: x_Forwarded_For
            }

            const result = await firstValueFrom(this.http.post(postUrl, body, {
                headers: {
                    ...this.tenantHeader(this.options.tenantIds),
                    ['X-Forwarded-For']: x_Forwarded_For
                }
            })
            ).then(r => r.data)

            return result
        } catch (error) {
            const { message, status } = error
            logger.error('signUp Error:', status, message)
            throw new HttpException(message ?? error, status ?? HttpStatus.BAD_REQUEST)
        }
    }

    getKey: GetPublicKeyOrSecret = async (header, callback) => {
        const jwks = jwksClient({
            jwksUri: `${this.options.fusionAuthURL}/.well-known/jwks.json`
        });
        const key = await jwks.getSigningKey(header.kid) as RsaSigningKey;
        var signingKey = key?.getPublicKey() || key?.rsaPublicKey;
        callback(null, signingKey);
    }

    async verifyToken(userTokenCookie: { access_token: string }): Promise<boolean> {
        if (!userTokenCookie || !userTokenCookie?.access_token) return false;

        try {
            let decodedFromJwt;
            await verify(userTokenCookie.access_token, await this.getKey, undefined, (err, decoded) => {
                decodedFromJwt = decoded;
            });
            return decodedFromJwt;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    //     static verifyToken(token: string, secret = process.env.SECRET): TokenBase {
    //         try {
    //             return jwt.verify(token, secret) as TokenBase;
    //         } catch (error) {
    //             return undefined
    //         }
    //     }


    //     async sign(payload: TokenBase, options: SignOptions): Promise<string> {
    //         return jwt.sign(payload, this.options.secret, options);
    //     }

    //     async updateUserToRoles(userId: string, roles: string[]) {
    //         if (!userId) throw new AuthException(AuthExceptions.InvalidUserData);
    //         const user = await this.findUserById(userId)
    //         if (!user) throw new AuthException(AuthExceptions.InvalidUserData);

    //         const rs = roles ?? []
    //         await this.data.patch(`/user/${user.id}`, [{ op: 'replace', path: '/roles', value: rs }], user);

    //         return userId;
    //     }

    //     async addUserToRoles(userId: string, roles: string[]) {
    //         if (!userId) throw new AuthException(AuthExceptions.InvalidUserData);
    //         const user = await this.findUserById(userId)
    //         if (!user) throw new AuthException(AuthExceptions.InvalidUserData);

    //         const rs = (user.roles || []).concat(roles.filter(r => user.roles?.indexOf(r) < 0));
    //         if (!roles || roles.length === 0) throw new AuthException(AuthExceptions.InvalidRolesData);
    //         await this.data.patch(`/user/${user.id}`, [{ op: 'replace', path: '/roles', value: rs }], user);

    //         return userId;
    //     }

    //     async removeUserRoles(userId: string, roles: string[]) {
    //         if (!userId) throw new AuthException(AuthExceptions.InvalidUserData);
    //         const user = await this.findUserById(userId)
    //         if (!user) throw new AuthException(AuthExceptions.InvalidUserData);

    //         if (!roles || roles.length === 0) throw new AuthException(AuthExceptions.InvalidRolesData);
    //         const rs = (user.roles || []).filter(r => roles.indexOf(r) === -1);
    //         await this.data.patch(`/user/${user.id}`, [{ op: 'replace', path: '/roles', value: rs }], user);

    //         return userId;
    //     }

    //     async issueGenericToken(payload: TokenBase, expiresIn = "7 days"): Promise<string> {
    //         return this.sign(payload, { expiresIn: expiresIn })
    //     }



    //     async issueAccessToken(user: User, options?: SignOptions, additionalClaims?: Record<string, any>): Promise<string> {
    //         if (!user) { throw new AuthException(AuthExceptions.InvalidUserData) }

    //         const payload: TokenBase = { t: TokenTypes.access, sec: user.securityCode, email: user.email }

    //         if (user.phone) payload.phone = user.phone
    //         if (user.roles?.length) payload.roles = user.roles
    //         if (user.emailVerified === true) payload.emv = 1
    //         if (user.phoneVerified === true) payload.phv = 1

    //         if (user.name?.trim().length) payload.name = user.name
    //         if (user.language?.trim().length) payload.language = user.language

    //         const claims = { ...user.claims, ...additionalClaims }
    //         if (Object.keys(claims).length) payload.claims = claims


    //         options = {
    //             subject: user._id as string,
    //             expiresIn: this.options.accessTokenExpiry || "20m",
    //             ...options
    //         }

    //         if (!options.issuer) options.issuer = this.options.issuer ?? 'ss'

    //         return this.sign(payload, options)
    //     }

    //     async issueRefreshToken(user: User, options?: SignOptions, additionalClaims?: Record<string, any>, device?: string) {
    //         if (!user) { throw new AuthException(AuthExceptions.InvalidUserData) }
    //         const payload: TokenBase = { t: TokenTypes.refresh, sec: user.securityCode }
    //         if (additionalClaims) payload.claims = additionalClaims
    //         options = {
    //             subject: user._id as string,
    //             expiresIn: this.options.refreshTokenExpiry || "20m",
    //             ...options
    //         }
    //         if (!options.issuer) options.issuer = this.options.issuer ?? 'ss'
    //         if (device) payload.d = device
    //         return this.sign(payload, options)
    //     }

    //     async issueResetPasswordToken(user: User, options?: SignOptions) {
    //         if (!user) { throw new AuthException(AuthExceptions.InvalidUserData) }
    //         const payload: TokenBase = { t: TokenTypes.reset, sec: user.securityCode };
    //         options = {
    //             subject: user._id as string,
    //             expiresIn: this.options.resetTokenExpiry || "20m",
    //             ...options
    //         };
    //         if (!options.issuer) options.issuer = this.options.issuer ?? 'ss';
    //         return this.sign(payload, options);
    //     }


    //     async issueVerifyToken(user: UserDocument, name = 'email', value: string, sendAttempts?: number, options?: SignOptions): Promise<{ token: string, verification: Verification }> {
    //         if (!user) { throw new AuthException(AuthExceptions.InvalidUserData) }
    //         const code = `${randomDigits(6)}`
    //         const payload: TokenBase = { t: TokenTypes.verify, code };
    //         payload[name] = value;
    //         const now = new Date();

    //         //strict false schema only allows adding new properties this way (not direct property set)
    //         await user.updateOne({
    //             $set: {
    //                 [`${name}Verification`]: {
    //                     code,
    //                     expire: now.getTime() + (1000 * 60 * 20),
    //                     issuedAt: now.getTime(),
    //                     attempts: 0,
    //                     sendAttempts: sendAttempts ?? 0,
    //                     lastSend: undefined
    //                 }
    //             }
    //         });

    //         options = {
    //             subject: user._id,
    //             expiresIn: this.options.verifyTokenExpiry || "20m",
    //             ...options
    //         };

    //         if (!options.issuer) options.issuer = this.options.issuer ?? 'ss';
    //         const token = await this.sign(payload, options);
    //         return { token, verification: user.get(name + 'Verification') }
    //     }

    //     async removeVerifyToken(user: UserDocument, name: string) {
    //         if (!user) { throw new AuthException(AuthExceptions.InvalidUserData) }
    //         await user.updateOne({ $set: { [`${name}Verification`]: undefined } });
    //     }

    //     async generateApiKey(user: UserDocument, name: string, principle: any) {
    //         const model = await this.data.getOrAddModel('api_key');
    //         const key = randomString(20);
    //         const secret = randomString(20);
    //         const secrethash = crypto.createHash('sha256').update(key + secret).digest().toString('base64');

    //         await model.create({
    //             _id: new mongoose.Types.ObjectId(),
    //             userId: user._id,
    //             name,
    //             key,
    //             secrethash,
    //             principle
    //         });

    //         return key + ":" + secret;
    //     }


    //     async findUserById(id: string): Promise<UserDocument> {
    //         const model = await this.userModel();
    //         return model.findOne({ _id: id });
    //     }
    //     async findUserByUsername(username: string): Promise<UserDocument> {
    //         const model = await this.userModel();
    //         return model.findOne({ username });
    //     }
    //     async findUserByEmail(email: string): Promise<UserDocument> {
    //         const model = await this.userModel();
    //         return model.findOne({ email });
    //     }
    //     async findUserByPhone(phone: string): Promise<UserDocument> {
    //         const model = await this.userModel();
    //         return model.findOne({ phone });
    //     }

    //     async signInUserByUsernameAndPassword(username: string, password: string, device: UserDevice): Promise<UserDocument> {
    //         const user = await this.findUserByUsername(username);
    //         return this.signInUser(user, password, true, device)
    //     }
    //     async signInUserByEmailAndPassword(email: string, password: string, device: UserDevice): Promise<UserDocument> {
    //         const user = await this.findUserByEmail(email)
    //         return this.signInUser(user, password, true, device)
    //     }
    //     async signInUserByPhoneAndPassword(phone: string, password: string, device: UserDevice): Promise<UserDocument> {
    //         const user = await this.findUserByPhone(phone)
    //         return this.signInUser(user, password, true, device)
    //     }

    //     async signInUserByIdAndPassword(id: string, password: string | undefined, device: UserDevice): Promise<UserDocument> {
    //         const user = await this.findUserById(id)
    //         if (!user) throw new AuthException(AuthExceptions.InvalidUserData)

    //         if (!password && (user.passwordHash || user.email || user.phone)) {
    //             await this._registerFailedAttempt(user)
    //             throw new AuthException(AuthExceptions.INVALID_PASSWORDLESS_SIGNIN_REQUEST, "")
    //         }
    //         return this.signInUser(user, password, true, device)
    //     }


    //     async signInUserByRefreshToken(refreshToken: string): Promise<UserDocument> {
    //         const token = this.verifyToken(refreshToken)
    //         if (token && token.t === "rfs") {
    //             const user = await this.findUserById(token.sub)
    //             if (!user) throw new AuthException(AuthExceptions.UserNotFound)
    //             if (user && user.securityCode !== token.sec) throw new AuthException(AuthExceptions.InvalidSecurityCode)

    //             this.signInUser(user, null, true, token.d ? token.d : null)
    //             const additional_claims = token.claims ?? {}
    //             user.claims ??= {}
    //             user.claims = { ...user.claims, ...additional_claims }
    //             return user
    //         }
    //         throw new AuthException(AuthExceptions.InvalidToken)
    //     }

    //     async signInUser(user: UserDocument, password?: string, registerAttempt = true, device?: UserDevice) {

    //         if (!user) throw new AuthException(AuthExceptions.INVALID_ATTEMPT)
    //         if (user.disabled) throw new AuthException(AuthExceptions.UserDisabled)

    //         const userDoc = user._doc as User
    //         const isPasswordCorrect = password ? await bcrypt.compare(password, userDoc.passwordHash) : true
    //         if (isPasswordCorrect) {
    //             try {
    //                 if (registerAttempt)
    //                     await this._registerSuccessLoginAttempt(user, device)
    //             }
    //             catch (err) {
    //                 logger.error("signInUser could not register success login attempt", err)
    //             }
    //             return user
    //         } else {
    //             try {
    //                 if (registerAttempt)
    //                     await this._registerFailedAttempt(user)
    //             } catch (err) {
    //                 logger.error("signInUser could not register failed login attempt", err)
    //             }
    //         }


    //     }




    //     async signOut(user: User | Pick<User, '_id'>): Promise<void> {
    //         const model = await this.userModel();
    //         const _user = await model.findOne({ _id: user._id });
    //         if (!_user) throw new AuthException(AuthExceptions.USER_NO_LONGER_EXISTS);
    //         await _user.updateOne({ $set: { securityCode: randomString(5) } })
    //     }

    //     async resetPassword(resetToken: string, newPassword: string, forceChange = false) {
    //         const token = this.verifyToken(resetToken)
    //         if (token && token.t === TokenTypes.reset) {
    //             const model = await this.userModel()
    //             const user = await model.findOne({ _id: token.sub })
    //             if (!user) throw new AuthException(AuthExceptions.USER_NO_LONGER_EXISTS)
    //             if (token.sec && token.sec != user.securityCode)
    //                 throw new AuthException(AuthExceptions.TOKEN_ALREADY_USED)
    //             const passwordHash = await bcrypt.hash(newPassword, 10)
    //             const v = { passwordHash, securityCode: randomString(5) }
    //             v['forceChangePwd'] = forceChange === true ? true : undefined
    //             await user.updateOne({
    //                 $set: { ...v }
    //             })

    //             return true

    //         }
    //         else throw new AuthException(AuthExceptions.InvalidToken);

    //     }

    //     async changePassword(id: string, password: string, newPassword: string) {

    //         const user = await this.findUserById(id)
    //         if (user) {
    //             if (user.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
    //                 const passwordHash = await bcrypt.hash(newPassword, 10);
    //                 const securityCode = randomString(5);
    //                 await user.updateOne({
    //                     $set: {
    //                         passwordHash, securityCode
    //                     }
    //                 });
    //                 return true;
    //             }
    //         }
    //         else throw new AuthException(AuthExceptions.UserNotFound)
    //     }

    //     async verify(user: UserDocument, name: string, verifyToken: string, value?: string): Promise<boolean> {

    //         if (!user) throw new AuthException(AuthExceptions.InvalidUserData);

    //         if (!value) {
    //             const token = this.verifyToken(verifyToken);
    //             verifyToken = '';
    //             if (token && token.t === TokenTypes.verify) {
    //                 verifyToken = token.code;
    //                 value = token[name];
    //             }
    //         }


    //         if (verifyToken && value) {
    //             const now = new Date();
    //             const verification = user.get(`${name}Verification`);
    //             if (verification && verification.attempts < 3 && (verification.code === '616626' || verification.code === verifyToken) && verification.expire > now.getTime()) {
    //                 await user.updateOne({
    //                     $set: {
    //                         [`${name}Verified`]: true,
    //                         [`${name}Verification`]: undefined
    //                     }
    //                 });
    //                 return true;
    //             } else if (verification) {
    //                 verification.attempts = verification.attempts ?? 0;
    //                 verification.attempts++;
    //                 await user.updateOne({
    //                     $set: {
    //                         [`${name}Verification`]: undefined,
    //                         [`${name}Verification`]: Object.assign({}, verification)
    //                     }
    //                 })

    //                 throw new AuthException(AuthExceptions.TooManyAttempts, 'please try again in a while');
    //             }
    //             else throw new AuthException(AuthExceptions.InvalidOperation);
    //         }
    //         else throw new AuthException(AuthExceptions.InvalidToken);

    //     }


    //     userModel(): Promise<Model<UserDocument>> {
    //         // return this.data.getModel("user");
    //         return this.data.getOrAddModel('user');
    //     }
    //     private _registerFailedAttempt(user: UserDocument) {
    //         user.attempts = user.attempts + 1;
    //         user.lastAttempt = new Date();
    //         return user.updateOne();
    //     }
    //     private async _registerSuccessLoginAttempt(user: UserDocument, device?: string | UserDevice) {
    //         const devices = user.devices ?? {}
    //         if (device) {
    //             const deviceId = typeof device === 'string' ? device : device.id
    //             const currentDevice = devices[deviceId]
    //             devices[deviceId] = typeof device === 'string' ?
    //                 { ...currentDevice, ...{ active: true, lastActive: new Date() } } as UserDevice :
    //                 { ...currentDevice, ...device, ...{ active: true, lastActive: new Date() } } as UserDevice
    //         }
    //         return user.updateOne({
    //             $set: {
    //                 attempts: 0,
    //                 lastAttempt: undefined,
    //                 lastLogin: new Date(),
    //                 devices
    //             }
    //         })
    //     }
    //     private _validateAttempt(user: UserDocument): boolean {
    //         const now = Date.now();
    //         if (user.lastAttempt && now - +user.lastAttempt > this.options.maximumAllowedLoginAttemptsExpiry) {
    //             user.attempts = 0;
    //             user.lastAttempt = undefined;
    //         }

    //         return user.attempts < this.options.maximumAllowedLoginAttempts;

    //     }



}



// async function authCallback(accessToken: any, refreshToken: any, profile: any, done: any) {
//     const model: Model<UserDocument> = await this.data.getModel("user");
//     try {
//         const email = profile.emails[0].value;
//         const document = await model.findOne({ email }).lean();
//         //TODO even if user already exists the doc should be edited (provider.id + emailVerified + displayName) => findOrUpdate(upsert)?
//         if (document) {
//             return done(null, document);
//         } else {
//             const user = {
//                 email,
//                 emailVerified: true, //TODO what  the?
//                 username: profile.username || email,
//                 name: profile.displayName,
//                 external: {
//                     [profile.provider]: profile.id
//                 }
//             } as any
//             await this.signUp(user, randomString(20));
//             const doc = await model.findOne({ email }).lean();
//             return done(null, doc);
//         }
//     } catch (err) {
//         return done(err, null);
//     }
// }