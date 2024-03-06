export type Any = { [key: string]: any };



export class Credentials {
    id?: string;
    username?: string;
    email?: string;
    phone?: string;
    password: string;
}

export type Verification = { type: 'token' | 'code', value: string, token: string };

export class UserBase {
    _id: string;
    username: string;
    disabled = false;
    attempts = 0;
    lastAttempt: Date;
    lastLogin: Date;
    email: string;
    phone?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    roles: string[] = [];
    claims: Record<string, object>;
}
export type User = UserBase & Any;
