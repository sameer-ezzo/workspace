import { Inject, Injectable } from '@nestjs/common'
import { Strategy } from 'passport-google-oauth20';

import { AuthStrategy } from './auth.strategy';
import { AuthOptions, AuthService } from '@ss/auth';


@Injectable()
export class GoogleStrategy extends AuthStrategy(Strategy, 'google') {

    constructor(public auth: AuthService, @Inject('AUTH_OPTIONS') public readonly options: AuthOptions) {
        super(auth, {
            clientID: options.externalAuth.google.client_id,
            clientSecret: options.externalAuth.google.client_secret,
            callbackURL: `${options.externalAuth.google.callback_base}/auth/google/callback`,
            passReqToCallback: true,
            scope: ['email', 'openid', 'profile'],

        }, (...args) => {
            this.validate(args[1], args[2], args[3], args[4])
        });
    }

}
