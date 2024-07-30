import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Redirect, Req, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport"
import { firstValueFrom } from "rxjs"

import type { IncomingMessage, UserDevice } from "@noah-ark/common"
import { User, randomString } from "@noah-ark/common"

import { Authorize, AuthorizeService } from "@ss/rules";
import { appName, Broker, EndPoint, Message } from "@ss/common";
import { DataChangedEvent, DataService } from "@ss/data";
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { Axios } from "axios";
import { logger } from "./logger";
import { AuthService, TokenTypes, UserDocument } from "@ss/auth";
import { AuthException, AuthExceptions } from "./auth-exception";
import { UsersOptions } from './types';




let installed = false

export type SigninRequestBase = { device?: UserDevice }
export type PasswordSigninRequestGrant = { grant_type: 'password', password: string } & ({ username: string } | { email: string } | { phone: string } | { id: string })
export type RefreshSigninRequestGrant = { grant_type: 'refresh', refresh_token: string }
export type SigninRequest = SigninRequestBase & (PasswordSigninRequestGrant | RefreshSigninRequestGrant)

@Controller('auth')
export class UsersController {
    private http: Axios
    constructor(
        private auth: AuthService,
        private readonly broker: Broker,
        @Inject('USERS_OPTIONS') private readonly options: UsersOptions,
        @Inject('AUTH_DB') private dataService: DataService,
        private authorizationService: AuthorizeService) {
        this.http = new Axios({
            transformResponse: [(data) => JSON.parse(data)]
        });

        setTimeout(() => { // wait for user model is added to data service
            const { password, role, email, username, name } = options.superAdmin
            this.installSuperAdmin({ email, username: username ?? email, name }, password, role)
                .then(() => { })
                .catch((error) => {
                    const { message } = error
                    if (message === 'ALREADY_INSTALLED' || message === 'USER_WITH_ROLE_EXISTS') return
                    logger.error(error)
                })
        }, 1000);

    }


    @EndPoint({ event: 'data-changed', path: 'data-changed' })
    public async userChanged(@Message() msg: IncomingMessage<DataChangedEvent<User>>) {
        const { path, patches, user, data } = msg.payload
        const model = await this.dataService.getModel('user')
        if (new RegExp(`^/user/([a-z0-9]+)$`).test(path)) {
            if (patches.some(p => p.path.includes('email')))
                await model.updateOne({ _id: data._id }, { $set: { emailVerified: false, emailVerification: undefined } })
            if (patches.some(p => p.path.includes('phone')))
                await model.updateOne({ _id: data._id }, { $set: { phoneVerified: false, phoneVerification: undefined } })
        }
    }


    @Authorize({ by: 'anonymous', access: 'grant' })
    @EndPoint({ http: { method: 'POST', path: 'forgotpassword' }, operation: 'Forgot Password' })
    public async forgotPassword(@Message() msg: IncomingMessage<{ email: string }>) {
        const email = msg.payload.email
        if (!email) return

        const user = await this.auth.findUserByEmail(email)
        if (!user) return

        const resetToken = await this.auth.issueResetPasswordToken(user)
        const expire = user.get("forgetExpire")
        const now = new Date().getTime()
        if (expire && expire > now)
            throw new HttpException('ALREADY_SENT', HttpStatus.BAD_REQUEST)

        user.set("forgetExpire", now + 1000 * 60 * 10)
        await user.save()
        this.broker.emit(`${appName}/auth/forgotpassword`, { ...msg.payload, user, token: resetToken });
    }


    private async installSuperAdmin(user: Partial<User>, password: string, role = 'super-admin') {
        if (installed) throw new Error('ALREADY_INSTALLED')

        const usersModel = await this.dataService.getModel('user')
        if (!usersModel) throw new Error('MISSING_USER_MODEL')

        const usersWithRole = await usersModel.countDocuments({ roles: { $in: [role] } })
        if (usersWithRole > 0) throw new Error(`USER_WITH_ROLE_EXISTS`);
        try {
            const dbUser = await usersModel.findOne({ email: user.email })
            let u = dbUser
            if (u) {
                logger.info(`Super admin user already exists, Setting password.`)
                await this.auth.changePassword(dbUser._id, dbUser.password, password)
            }
            else {
                logger.info(`Creating super admin user.`)
                const payload = { ...user } as Partial<User>
                u = await this.auth.signUp(payload as Partial<User>, password)
            }
            installed = true
            await this.auth.addUserToRoles(u._id, [role])
            installed = true
            logger.info(`Super admin user set to ${user.email}`)
            return { ...u, roles: [...(u.roles ?? []), role] }
        } catch (error) {
            installed = false
            throw error
        }

    }

    @EndPoint({ http: { method: 'POST', path: 'resetpassword' }, operation: 'Reset Password' })
    public async resetpassword(@Message() msg: IncomingMessage<{ new_password: string, reset_token: string }>) {
        const new_password = msg.payload.new_password
        const reset_token = msg.payload.reset_token
        if (new_password && reset_token) {
            try {
                const result = await this.auth.resetPassword(reset_token, new_password)
                if (result) return { reset: true }
            } catch (error) {
                //todo: error msg
                logger.error(error)
                throw new HttpException(error.message || error.code || 'ERROR', HttpStatus.BAD_REQUEST)
            }
        } else throw new HttpException('INVALID_DATA', HttpStatus.BAD_REQUEST)
    }

    @EndPoint({ http: { method: 'POST', path: 'changepassword/:id' }, operation: 'Change Password' })
    @Authorize({ by: 'user', access: 'grant' })
    public async changePassword(@Message() msg: IncomingMessage<{ new_password: string, old_password: string }>) {
        if (!msg.payload) throw new HttpException('MISSING_INFO', HttpStatus.BAD_REQUEST)
        const { new_password, old_password } = msg.payload
        if (new_password === old_password) return true

        const id = msg.query.id as string
        if (!id) throw new HttpException('MISSING_ID', HttpStatus.BAD_REQUEST)
        const user = await this.auth.findUserById(id)
        if (!user) throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND)

        if (new_password) {
            try {
                const result = await this.auth.changePassword(
                    id,
                    old_password,
                    new_password
                );
                if (result) return true
                else throw new HttpException('INVALID_PASSWORD', HttpStatus.BAD_REQUEST)
            } catch (error) {
                //todo: error msg
                logger.error(error)
                throw new HttpException(error.message ?? 'ERROR', HttpStatus.BAD_REQUEST)
            }
        }
        else throw new HttpException('INVALID_DATA', HttpStatus.BAD_REQUEST)
    }

    @EndPoint({ http: { method: 'POST', path: 'adminreset' }, operation: 'Reset User\'s Password' })
    public async adminReset(@Message() msg: IncomingMessage<{ email: string, new_password: string, forceChangePwd: boolean }>) {
        if (!msg.payload) throw new HttpException('MISSING_INFO', HttpStatus.BAD_REQUEST)
        const { email, new_password, forceChangePwd } = msg.payload
        //todo: register this event with admin info
        const { access, rule, source } = this.authorizationService.authorize(msg, 'update')
        if (access === 'deny') throw new HttpException({ rule, source }, HttpStatus.FORBIDDEN)

        const user = await this.auth.findUserByEmail(email)
        if (!user) throw new HttpException('INVALID_USER', HttpStatus.NOT_FOUND)

        const resetToken = await this.auth.issueResetPasswordToken(user)
        const result = await this.auth.resetPassword(resetToken, new_password, forceChangePwd === true)
        await this.auth.signOut(user)
        if (result) return { result: true };
        else throw new HttpException("INVALID_OPERATION", HttpStatus.BAD_REQUEST)
    }


    @EndPoint({ http: { method: 'POST', path: 'addusertoroles' }, operation: 'Add User To Roles' })
    public async addUserToRoles(@Message() msg: IncomingMessage<{ userId: string, roles: string[] }>) {

        const { userId, roles } = msg.payload;
        if (!userId) throw new HttpException('MISSING_USER_ID', HttpStatus.BAD_REQUEST)
        const usersModel = await this.dataService.getModel('user')
        if (!usersModel) throw new HttpException('MISSING_USER_MODEL', HttpStatus.BAD_REQUEST)
        const user = await usersModel.findOne({ _id: userId })
        if (!user) throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND)
        await this.auth.addUserToRoles(user._id, roles)

        this.auth.signOut(user)
        return msg.payload
    }

    @EndPoint({ http: { method: 'POST', path: 'changeuserroles' }, operation: 'Change User Roles' })
    
    public async changeUserRoles(@Message() msg: IncomingMessage<{ userId: string, roles: string[] }>) {

        const { userId, roles } = msg.payload;
        await this.auth.changeUserToRoles(userId, roles)
        this.auth.signOut({ _id: userId })
        return msg.payload
    }

    @EndPoint({ http: { method: 'POST', path: 'admincreateuser' }, operation: 'Admin Create User' })
    
    public async adminCreateUser(@Message() msg: IncomingMessage<any>) {

        const _user = msg.payload;

        const roles = _user?.roles as string[]
        delete _user.roles

        try {
            const user_errors = this.auth.verifyUser(_user)
            if (user_errors.length) {
                return user_errors
            }
            const res = await this.auth.signUp(_user, _user.password)
            if (roles?.length) this.auth.addUserToRoles(res._id, roles)
            return { _id: res._id, ...msg.payload }

        } catch (error) {
            throw new HttpException(error.message ?? 'ERROR', HttpStatus.BAD_REQUEST)
        }
    }


    @EndPoint({ http: { method: 'POST', path: 'impersonate' }, operation: 'Impersonate User' })
    
    public async impersonate(@Message() msg: IncomingMessage<{ sub: string }>) {
        //get current principle
        const principle = msg.principle
        if (!principle) throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED)

        //if yes, get user by id
        const user = (await this.auth.findUserById(msg.payload.sub)).toObject() as User
        if (!user) throw new HttpException('INVALID_USER_ID', HttpStatus.NOT_FOUND)

        //add impersonate claim
        user.claims ??= {}
        user.claims.imps = principle.sub

        return {
            access_token: await this.auth.issueAccessToken(user),
            refresh_token: await this.auth.issueRefreshToken(user, null, { imps: principle.sub })
        }
    }



    private async _doSignIn(msg: IncomingMessage<SigninRequest>): Promise<any> {
        const grantType = msg.payload.grant_type
        switch (grantType) {
            case "password":
                {
                    const password = msg.payload.password
                    if (!password && !msg.payload['id']) throw new HttpException('INVALID_PASSWORD', HttpStatus.BAD_REQUEST) //allow id signin without passing a password

                    let user: User | null = null
                    if ('id' in msg.payload) user = await this.auth.signInUserByIdAndPassword(msg.payload.id, password, msg.payload.device)
                    else if ('username' in msg.payload) user = await this.auth.signInUserByUsernameAndPassword(msg.payload.username, password, msg.payload.device)
                    else if ('email' in msg.payload) user = await this.auth.signInUserByEmailAndPassword(msg.payload.email, password, msg.payload.device)
                    else if ('phone' in msg.payload) user = await this.auth.signInUserByPhoneAndPassword(msg.payload.phone, password, msg.payload.device)

                    if (!user) throw new HttpException(new AuthException(AuthExceptions.INVALID_ATTEMPT), HttpStatus.BAD_REQUEST)

                    return user.forceChangePwd === true ?
                        { reset_token: await this.auth.issueResetPasswordToken(user) } :
                        {
                            access_token: await this.auth.issueAccessToken(user),
                            refresh_token: await this.auth.issueRefreshToken(user, null, null, msg.payload.device?.id)
                        }
                }
            case "refresh":
                {
                    const token = await this.auth.verifyToken(msg.payload.refresh_token)
                    let user: User | null = null
                    if (token) {

                        user = await this.auth.signInUserByRefreshToken(msg.payload.refresh_token)
                        if (token.d) {
                            const currentDevice = user.devices?.[token.d]
                            if (!currentDevice || currentDevice.active === false) throw new HttpException('INVALID_DEVICE', HttpStatus.BAD_REQUEST)
                        }
                    } else if (msg.principle) {
                        try {
                            user = await this.auth.signInUserByPrinciple(msg.principle)
                        } catch (error) {
                            if (error.code == AuthExceptions.UserNotFound && msg.ctx.authProvider?.shouldCreateUser(msg.principle)) {
                                await this.auth.signUp({
                                    email: msg.principle.email,
                                    username: msg.principle.email,
                                    external: {
                                        ...msg.principle,
                                        provider: msg.ctx.authProvider.constructor.name
                                    }
                                })
                                user = await this.auth.findUserByEmail(msg.principle.email)
                                if (!user) throw new HttpException('USER_NOT_FOUND', HttpStatus.NOT_FOUND)
                            }
                            else throw error
                        }

                    }
                    else throw new HttpException('INVALID_TOKEN', HttpStatus.BAD_REQUEST)

                    return {
                        access_token: await this.auth.issueAccessToken(user),
                        refresh_token: await this.auth.issueRefreshToken(user, null, token.claims, token.d),
                    }


                }
            //QUESTION: What if user deleted or wanted to change an api key?
            //there is no login with api key because api_key should never expire
            // case "api_key":
            // try {

            // } catch (error) {
            //   next(error);
            // }
            // break;
            default: throw new HttpException(AuthExceptions.InvalidGrantType, HttpStatus.BAD_REQUEST);
        }
    }



    @Authorize({ by: 'anonymous', access: 'grant' })
    @EndPoint({ http: { method: 'GET', path: 'google/callback' } })
    async googleAuthRedirect(@Req() req) {
        const user: User = await this.auth.findUserByEmail(req.user.email);
        const access_token = await this.auth.issueAccessToken(user);
        const refresh_token = await this.auth.issueRefreshToken(user);
        return { url: `${this.auth.options.externalAuth.google.client_url}/login?access_token=${access_token}&refresh_token=${refresh_token}` }
    }

    @Authorize({ by: 'anonymous', access: 'grant' })
    @EndPoint({ http: { method: 'POST', path: 'google-auth' }, operation: 'Auth with google' })
    async clientExternalAuth(@Body() req) {
        const googleUser = await verifyGoogleUser(req.token)
        if (!googleUser) {
            // maybe check if the user had been registered using google, the lock the user account or delete it.
            throw new HttpException("invalid token", HttpStatus.BAD_REQUEST);
        }

        let userRecord: User = await this.auth.findUserByEmail(googleUser.email);

        const GOOGLE_CLIENT_REGISTRATION_ENABLED = (process.env.GOOGLE_CLIENT_REGISTRATION_ENABLED || 'false').toLowerCase() === 'true'


        if (!userRecord) {
            if (GOOGLE_CLIENT_REGISTRATION_ENABLED !== true) throw new HttpException("User not found", HttpStatus.NOT_FOUND)
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
            } as unknown as User
            const external = userRecord?.external ?? {}
            try {
                const res = await this.auth.signUp({
                    ...user,
                    external: { ...external, ['google']: googleUser.sub }
                } as User, '')
                userRecord = await this.auth.findUserByEmail(res.email);

            } catch (error) {
                throw new HttpException(error.message ?? 'ERROR', HttpStatus.BAD_REQUEST)
            }
        }

        const access_token = await this.auth.issueAccessToken(userRecord);
        const refresh_token = await this.auth.issueRefreshToken(userRecord);
        return { access_token, refresh_token }
    }

    @Authorize({ by: 'anonymous', access: 'grant' })
    @EndPoint({ http: { method: 'POST', path: 'fbacebook-auth' }, operation: 'Auth with Facebook' })
    async fb_clientExternalAuth(@Body() req) {
        const fbuser = await this.http.get("https://graph.facebook.com/v1.0" + "/me?fields=id,name,email" + "&access_token=" + req.access_token)
        const inspectToken = await this.http.get("https://graph.facebook.com/debug_token?" + "input_token=" + req.access_token + "&access_token=" + process.env.FACEBOOK_APP_TOKEN)
        // verifying the user token was issued by our app
        if (inspectToken.status !== 200) throw new HttpException("invalid token", HttpStatus.BAD_REQUEST);
        const user = {
            username: fbuser.data.email,
            email: fbuser.data.email,
            name: fbuser.data.name
        }
        let userRecord = await this.auth.findUserByEmail(fbuser.data.email);
        if (!userRecord) {
            const facebook_client_regeneration_enabled = (process.env.FACEBOOK_CLIENT_REGENERATION_ENABLED || 'false').toLowerCase() === 'true'
            if (!userRecord || userRecord.external?.facebook !== fbuser.data.email) {
                if (facebook_client_regeneration_enabled === true) {
                    const external = userRecord?.external ?? {}
                    await this.auth.signUp({
                        ...user,
                        external: { ...external, ['facebook']: fbuser.data.email }
                    } as unknown as User,
                        '')
                }
                else userRecord = { _id: fbuser.data.email, ...user } as any
            }
        }

        const access_token = await this.auth.issueAccessToken(userRecord);
        const refresh_token = await this.auth.issueRefreshToken(userRecord);
        return { access_token, refresh_token }
    }



    @Get("/facebook/redirect")
    @Redirect('https://nestjs.com', 301)
    @UseGuards(AuthGuard("facebook"))
    async facebookLoginRedirect(@Req() req: Request) {
        const { user } = req as Request & { user: User };
        if (!user) throw new HttpException("invalid token", HttpStatus.BAD_REQUEST);
        const access_token = await this.auth.issueAccessToken(user);
        const refresh_token = await this.auth.issueRefreshToken((<any>req).user);
        return { url: `${this.auth.options.externalAuth.facebook.client_url}/login?access_token=${access_token}&refresh_token=${refresh_token}` }
    }

    @EndPoint({ http: { method: 'POST', path: '' }, operation: 'Login' })
    @Authorize({ by: 'anonymous', access: 'grant' })
    public async signIn(@Message() msg: IncomingMessage<SigninRequest>) {

        try {
            return await this._doSignIn(msg);
        } catch (error) {
            if (error instanceof AuthException) throw new HttpException(error, HttpStatus.BAD_REQUEST);
            else throw error;
        }
    }

    @EndPoint({ http: { method: 'POST', path: 'signup' }, operation: 'Sign up' })
    @Authorize({ by: 'anonymous', access: 'grant' })
    public async signup(@Message() msg: IncomingMessage<User & { password: string }>) {
        try {
            const _user = msg.payload;
            const user_errors = this.auth.verifyUser(msg.payload);
            if (user_errors.length) {
                throw new HttpException(user_errors, HttpStatus.BAD_REQUEST);
            }
            const user = await this.auth.signUp(_user, msg.payload.password)
            delete user.passwordHash

            this.broker.emit('auth.signup', _user)
            return user
        } catch (error) {
            logger.error('', error)
            throw new HttpException(error.message ?? 'ERROR', HttpStatus.BAD_REQUEST)
        }
    }


    @EndPoint({ http: { method: 'POST', path: 'lock' }, operation: 'Lock User' })
    
    public async lock(@Message() msg: IncomingMessage<{ id: string, lock: string | boolean }>) {

        const id = msg.payload.id ?? msg.payload['_id'];
        if (!id) {
            throw new HttpException('MISSING_ID_VALUE', HttpStatus.BAD_REQUEST);
        }

        let lock: boolean;
        if (msg.payload.lock === "true" || msg.payload.lock === true) lock = true;
        else if (msg.payload.lock === "false" || msg.payload.lock === false)
            lock = false;
        else {
            throw new HttpException('INVALID_LOCK_VALUE', HttpStatus.BAD_REQUEST);
        }

        const user = await this.auth.model.findById(id);
        if (user) {
            user.disabled = lock;
            await user.save();
            return true;
        } else
            throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND);
    }


    @Get('api-token')
    async apiToken(@Message() msg) {
        if (msg.principle) {
            const api_token = await this.auth.issueAccessToken(msg.principle); //{scope:"data,mailer",audience:""});
            return `api-token : ${api_token}`;
        }
        else throw new HttpException(null, HttpStatus.FORBIDDEN);
    }


    @EndPoint({ http: { method: 'POST', path: 'verify/send' }, operation: 'Send Verification' })
    public async sendVerification(@Message() msg: IncomingMessage<{ id: string, name: string, value: string }>) {
        const name = (msg.payload.name ?? "").trim();
        const value = (msg.payload.value ?? "").trim();
        if (!name || !value) throw new HttpException("INVALID_ARGUMENTS", HttpStatus.BAD_REQUEST)

        const principle = msg.principle;
        const id = msg.payload.id ?? principle?.sub;

        let token = undefined

        //query user
        const user = await this.getUser(name, value, id)
        if (!user) throw new HttpException('Can not find user', HttpStatus.NOT_FOUND)

        let verification = user.get(`${name}Verification`)
        const now = new Date().getTime();

        if (!verification || now > verification.issuedAt + (1000 * 60 * 20)) {
            const r = await this.auth.issueVerifyToken(user, name, value, verification?.sendAttempts)
            token = r.token
            verification = r.verification
        }
        else if (verification.sendAttempts > 2 && now - verification?.lastSend < (60 * 1000)) throw new HttpException("ALREADY_SENT", HttpStatus.BAD_REQUEST)

        const code = verification.code
        try {
            const result = firstValueFrom(this.broker.send('auth.send-verification-notification', { to: value, name, id, code, token }))
            verification = { ...verification, lastSend: now, sendAttempts: verification.sendAttempts + 1 }
            user.set(`${name}Verification`, verification)
            await user.save();
        } catch (error) {
            logger.error(error);
            throw error
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



    @EndPoint({ http: { method: 'POST', path: 'verify' }, operation: 'Verify' })
    public async verify(@Message() msg: IncomingMessage<{ id: string, name: string, value: string, token: string, type: string }>) {

        try {
            const u = msg.principle;
            const name = (msg.payload.name || "").trim();//email|phone
            const value = (msg.payload.value || "").trim();
            const type = (msg.payload.type || "").trim();
            let token = (msg.payload.token || "").trim();
            if (type === 'code' && (!name || !value)) throw new HttpException('INVALID_ARGS', HttpStatus.BAD_REQUEST);
            //When type is token then all we need is to verify that token and update the user properly

            const user = await this.getUser(name, value, msg.payload.id || u?.sub);
            if (!user) throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND);


            await this.auth.verify(user, name, msg.payload.token, value);

            token = await this.auth.issueGenericToken({ t: TokenTypes.verify, [name]: value });
            return { token };
        } catch (error) {
            //todo: error msg
            logger.log(error);
            throw new HttpException({ ...error }, HttpStatus.BAD_REQUEST);
        }
    }


    @EndPoint({ http: { method: 'POST', path: 'device' }, operation: 'Add Device' })
    public async updateDevice(@Message() msg: IncomingMessage<UserDevice>) {
        const principal = msg.principle
        if (!principal) throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND)

        const device = msg.payload
        if (!device.id) throw new HttpException('INVALID_DEVICE', HttpStatus.BAD_REQUEST)

        const user = await this.auth.findUserById(principal.sub)
        const devices = user.devices

        if (!devices?.[device.id]) throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND)
        devices[device.id] = { ...devices?.[device.id], ...device }
        await user.updateOne({
            $set: {
                devices: devices
            }
        })
    }

    @EndPoint({ http: { method: 'DELETE', path: 'device' }, operation: 'Remove Device' })
    public async removeDevice(@Message() msg: IncomingMessage<UserDevice>) {
        const principal = msg.principle
        if (!principal) throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND)

        const deviceId = msg.query?.id as string
        if (!deviceId) throw new HttpException('INVALID_DEVICE', HttpStatus.BAD_REQUEST)

        const user = await this.auth.findUserById(principal.sub)
        const devices = user.devices

        if (!devices?.[deviceId]) throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND)

        delete devices[deviceId]

        await user.updateOne({
            $set: {
                devices: devices
            }
        })

        return "OK"
    }

    @EndPoint({ http: { method: 'GET', path: 'whoami' }, operation: 'Who am I' })
    @Authorize({ by: 'anonymous' })
    public async whoami(@Message() msg: IncomingMessage) {
        return msg.principle ?? {}
    }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET); // TODO: verify user tokens signed in using google auth on client side
async function verifyGoogleUser(token: string): Promise<TokenPayload> {
    try {
        // client.verifySignedJwtWithCerts()
        const ticket = await client.verifyIdToken(
            { idToken: token }
        );
        const payload = ticket.getPayload();
        return payload
    } catch (error) {
        logger.error(error)
    }
}


