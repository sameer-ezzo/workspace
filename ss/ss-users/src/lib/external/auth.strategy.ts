import { PassportStrategy } from "@nestjs/passport"
import { Model } from "mongoose"
import { Profile } from "passport-facebook"
import { UserDocument } from "../user.document"
import { AuthService } from "../auth.svr";
import { SocialProvider, User, randomString } from "@noah-ark/common"



export function AuthStrategy(Strategy: any, name?: string | undefined) {
    return class extends PassportStrategy(Strategy, name) {
        constructor(public authService: AuthService, ...args: any[]) {
            super(...args);

        }
        async validate(
            accessToken: string,
            refreshToken: string,
            profile: Profile,
            done: (err: any, user: any, info?: any) => void
        ): Promise<any> {
            const model: Model<UserDocument> = await this.authService.data.getModel("user")
            try {
                const email = profile.emails[0].value;
                const document = await model.findOne({ email }).lean()
                if (document) return done(null, document)
                else {
                    const user: User = {
                        email,
                        emailVerified: true,
                        username: profile.username || email,
                        name: profile.displayName,
                        passwordHash: profile.id,
                        attempts: 0,
                        phoneVerified: false,
                        securityCode: '',
                        disabled: false,
                        claims: null,
                        language: 'en',
                        roles: null,
                        external: {
                            [profile.provider as SocialProvider]: profile.id
                        }
                    }
                    await this.authService.signUp(user, randomString(20))
                    return done(null, user)
                }
            } catch (err) {
                return done(err, null)
            }
        }
    }
}

