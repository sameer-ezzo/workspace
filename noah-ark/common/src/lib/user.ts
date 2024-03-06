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
} & Record<string, unknown>

export class PrincipleBase {
    sub: string
    name: string
    email?: string
    phone?: string
    roles: string[] = []
    claims: UserClaims
    exp: number
    iat: number
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