export type SocialProvider = 'google' | 'facebook' | 'twitter' | 'github' | 'microsoft' | 'apple' | 'linkedin' | 'yahoo' | 'yandex' | 'vk' | 'ok' | 'mailru' | 'twitch' | 'discord' | 'spotify' | 'reddit' | 'pinterest' | 'line' | 'kakao' | 'instagram';

export type UserClaims = Record<string, string | number | boolean>
export type User = {
    _id?: string
    username: string
    passwordHash: string
    securityCode: string
    language: string
    email?: string
    emailVerified: boolean
    phone?: string
    phoneVerified: boolean
    disabled: boolean
    attempts: number
    lastAttempt?: Date
    lastLogin?: Date
    lastPasswordHash?: string
    lastPasswordChange?: Date
    claims: UserClaims
    roles: string[]
    name?: string
    devices?: { [deviceId: string]: UserDevice }
} & Record<string, unknown> & {
    external: Partial<{
        [k in SocialProvider]: string
    }>
}



export class PrincipleBase {
    sub!: string
    roles: string[] = []
    exp!: number
    iat!: number
    name?: string
    email?: string
    phone?: string
    claims?: UserClaims
    phv?: boolean
    emv?: boolean
}
export type Principle = PrincipleBase & Record<string, unknown>

export type UserDevice<TSubscription = any> = {
    id: string
    type: string
    active?: boolean
    primary?: boolean
    lastActive?: Date
    subscription: TSubscription
}