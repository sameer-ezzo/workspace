

export class SuperAdmin {
    email!: string
    username?: string
    name?: string = 'Super Admin'
    password: string
    roles = ['super-admin']
}
export class UsersOptions {
    superAdmin: SuperAdmin
}
