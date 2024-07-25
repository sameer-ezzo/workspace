

export class SuperAdmin {
    email!: string
    username?: string
    name?: string = 'Super Admin'
    password: string
    role = 'super-admin'
}
export class UsersOptions {
    superAdmin: SuperAdmin
}
