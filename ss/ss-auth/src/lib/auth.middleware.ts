import { Observable, of, throwError } from 'rxjs'
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { AuthService, TokenTypes } from './auth.svr'

import { timeout } from 'rxjs/operators'
import { logger } from "./logger";
import { Principle } from "@noah-ark/common"
import * as jose from "jose"



function promisify<T>(o: Observable<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        o.pipe(timeout(400)).subscribe({ next: v => resolve(v), error: err => reject(err) })
    })
}
@Injectable()
export class AuthenticationInterceptor implements NestInterceptor {

    constructor(private auth: AuthService) { }

    providers: HttpAuthenticationProvider[] = [
        new BearerAuthenticationProvider(this.auth),
        new CloudflareCookieAuthenticationProvider(this.auth)
    ]

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {

        switch (context.getType()) {
            case 'rpc':
                try {
                    const result = await promisify(next.handle());
                    return of(result)
                } catch (error) {
                    logger.error("Error was caught in AuthenticationInterceptor:RPC next.handle()", error.message, context.getArgs())
                    return throwError(() => error)
                }
            case 'http':
                await this._authenticateHttp(context.switchToHttp().getRequest())
                break;
            case 'ws':
            default:
                console.error('AuthenticationInterceptor: unsupported context type', context.getType())
                break;

        }
        return next.handle() // internal call no need to authenticate



    }

    async _authenticateHttp(req: Request & Record<string, any>) {
        if (req.principle) return req.principle

        for (const provider of this.providers) {
            const principle = await provider.authenticate(req)
            if (principle) {
                // fill out context object
                if (!req._context) req._context = {}
                req._context.principle = req.principle
                req._context.authProvider = provider
                return principle
            }
        }

    }





}

import { Request } from 'express';
import { _env_secret } from '@ss/common'

export interface HttpAuthenticationProvider {
    authenticate(req: Request): Promise<Principle>
    shouldCreateUser(principle: Principle): boolean
}



export class BearerAuthenticationProvider implements HttpAuthenticationProvider {
    constructor(private auth: AuthService, public readonly headerName = 'Authorization') { }
    async authenticate(req: Request & Record<string, any>): Promise<Principle> {

        if (req.principle) return req.principle

        const auth = req.get(this.headerName) as string
        if (auth) {
            const spaceIndex = auth.indexOf(' ')
            const authType = auth.substring(0, spaceIndex)
            switch (authType) {
                case 'Bearer': req.principle = await this._authenticateBearer(auth.substring(7))
            }
        }
        if (req.query.access_token) {
            const access_token = req.query.access_token as string
            req.principle = await this._authenticateBearer(access_token)
        }

        return req.principle
    }

    async _authenticateBearer(token: string) {
        const principle = await this.auth.verifyToken(token)
        if (principle?.t === TokenTypes.access) {
            delete principle.t
            return principle
        }
    }

    shouldCreateUser(): boolean {
        return false
    }


}


export class CookieAuthenticationProvider implements HttpAuthenticationProvider {

    jkws_cache: Record<string, any> = {}

    constructor(protected auth: AuthService, public readonly cookieName = 'Authorization', public readonly jwksPath = '/oauth2/v3/certs') { }
    async authenticate(req: Request & Record<string, any>): Promise<Principle> {

        const cookie = req.get('Cookie')
        if (!cookie) return null

        const cookies = cookie.split(';').map(c => c.split('=').map(x => x.trim()))
        const token = cookies.find(c => c[0] === this.cookieName)?.[1]
        if (!token) return null

        const claims = jose.decodeJwt(token)
        if (!claims) return null

        const issuer = claims.iss
        const header = jose.decodeProtectedHeader(token)

        if (header.kid && issuer.startsWith('http')) {
            try {

                const JWKS = this.jkws_cache[issuer] ? this.jkws_cache[issuer] : (this.jkws_cache[issuer] = await jose.createRemoteJWKSet(new URL(`${issuer}${this.jwksPath}`)))
                const { payload } = await jose.jwtVerify(token, JWKS)
                req.principle = payload as Principle
            }
            catch (error) {
                if (error.code != 'ERR_JWT_EXPIRED')
                    console.error('CookieAuthenticationProvider.authenticate', error)
            }
        } else {
            const secret = _env_secret()
            try {
                const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret))
                req.principle = payload as Principle
            }
            catch (error) { }
        }

        return req.principle
    }

    shouldCreateUser(): boolean {
        return true
    }
}



export class CloudflareCookieAuthenticationProvider extends CookieAuthenticationProvider {
    constructor(protected auth: AuthService) {
        super(auth, 'CF_Authorization', '/cdn-cgi/access/certs')
    }
}
