import { Inject, Injectable } from "@nestjs/common"
import { Strategy } from "passport-facebook"

import { AuthStrategy } from "./auth.strategy"
import { AuthOptions, AuthService } from "@ss/auth";



@Injectable()
export class FacebookStrategy extends AuthStrategy(Strategy, 'facebook') {
    constructor(public auth:AuthService,@Inject('AUTH_OPTIONS') public readonly options: AuthOptions,
    ) {
        super(auth,{
            clientID: options.externalAuth.facebook.app_id,
            clientSecret: options.externalAuth.facebook.app_secret,
            callbackURL: `${options.externalAuth.facebook.callback_base}/auth/facebook/callback`,
            scope: "email",
            profileFields: ["emails", "name"],
        }, (...args) => {
            this.validate(args[1], args[2], args[3], args[4])
        });
    }

   
}
