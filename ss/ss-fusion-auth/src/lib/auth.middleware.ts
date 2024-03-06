import { Observable, of, throwError } from 'rxjs'
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { FusionAuthService } from './auth.svr'

import * as crypto from 'crypto'
import { timeout } from 'rxjs/operators'
import { logger } from "./logger";

function promisify<T>(o: Observable<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        o.pipe(timeout(400)).subscribe({ next: v => resolve(v), error: err => reject(err) })
    })
}
@Injectable()
export class AuthenticationInterceptor implements NestInterceptor {

    constructor(private auth: FusionAuthService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        await this._authenticate(context)
        if (context.getType() !== 'rpc') return next.handle()
        else {
            try {
                const result = await promisify(next.handle());
                return of(result)
            } catch (error) {
                logger.error("Error was caught in AuthenticationInterceptor:RPC next.handle()", error.message, context.getArgs())
                return throwError(() => error)
            }
        }
    }

    async _authenticate(context: ExecutionContext) {

        switch (context.getType()) {
            case 'http':
                const req = context.switchToHttp().getRequest()
                req.principle ??= await this._authenticateHttpContext(context)
                // req.user = req.principle
                if (req._context) req._context.principle = req.principle
                else req._context = { principle: req.principle }
                break
            case 'rpc':
                {
                    const data = context.switchToRpc().getData()
                    data.principle ??= await this._authenticateRpcContext(context)
                }
                break
            case 'ws':
                {
                    const data = context.switchToWs().getData()
                    data.principle ??= await this._authenticateWsContext(context)
                }
                break
            default:
                logger.error(`Unknown Transport ${context.getType()}`)
                break
        }
    }

    private _authenticateHttpContext(context: ExecutionContext) {
        const req = context.switchToHttp().getRequest()
        const auth = req.get('Authorization') as string
        if (auth) {
            const spaceIndex = auth.indexOf(' ')
            const authType = auth.substring(0, spaceIndex)
            switch (authType) {
                case 'Bearer': return this._authenticateBearer(auth.substring(7))
                case 'Basic': return this._authenticateBasic(auth.substring(6))
                default: throw `Authentication Type ${authType} is not supported`
            }
        }
        if (req.query.access_token) {
            const access_token = req.query.access_token
            delete req.query.access_token
            return this._authenticateBearer(access_token) //todo: find better way to pass access token.
        }
    }

    private _authenticateRpcContext(context: ExecutionContext) {
        const msg = context.switchToRpc().getData()
        if (msg.access_token) {
            const access_token = msg.access_token
            delete msg.access_token
            return this._authenticateBearer(access_token)
        }
    }

    private _authenticateWsContext(context: ExecutionContext) {
        const client = context.switchToWs().getClient()
        const msg = context.switchToWs().getData()
        if (client.handshake.auth?.token) {
            const access_token = client.handshake.auth.token
            return this._authenticateBearer(access_token)
        }
    }

    async _authenticateBearer(token: string) {
        const principle = this.auth.verifyToken({ access_token: token })
        return principle
    }

    async _authenticateBasic(basic: string) {
        const [key, secret] = basic.substring(8).split(":")

        // const model = await this.data.getOrAddModel('api_key')
        // const document = (await model.findOne({ key }, null, { lean: true })) as any

        // if (document) {
        //     const hash = crypto.createHash('sha256')
        //         .update(key + secret)
        //         .digest()
        //         .toString('base64')

        //     if (document.secrethash === hash) {
        //         return document.principle //roles, claims, scope, audiance
        //     }
        // }
    }

}
