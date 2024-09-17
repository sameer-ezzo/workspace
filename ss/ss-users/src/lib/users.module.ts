import { DynamicModule, Module, Provider } from '@nestjs/common'
import { UsersController } from './users.controller'
import { CommonModule, logger } from '@ss/common'
import { DataModule } from '@ss/data'
import { RulesModule } from '@ss/rules'
import { AuthModule } from '@ss/auth'
import { UsersOptions } from './types'

const defaultOptions = new UsersOptions();

const providers: Provider[] = [
    { provide: 'AUTH_DB', useExisting: process.env['DB_AUTH'] ? 'DB_AUTH' : 'DB_DEFAULT' }
]



@Module({
    imports: [AuthModule, RulesModule, DataModule, CommonModule],
    controllers: [UsersController],
    providers: [...providers, { provide: 'USERS_OPTIONS', useValue: defaultOptions }],
})
export class UsersModule {
    static register(userOptions: Partial<UsersOptions> = {}): DynamicModule {

        const options = {
            ...defaultOptions,
            ...userOptions,
        } as UsersOptions

        const superAdminErrors = this.validateSuperAdmin(options.superAdmin)
        if (superAdminErrors) {
            if (process.env.NODE_ENV === 'production') throw new Error(`Invalid super admin options: ${JSON.stringify(superAdminErrors)}`)
            else logger.error(`Invalid super admin options: ${JSON.stringify(superAdminErrors)}`)
        }

        const usersProviders = [...providers, { provide: 'USERS_OPTIONS', useValue: options }]
        return {
            module: UsersModule,
            providers: usersProviders,
            controllers: [UsersController],
        };
    }

    static validateSuperAdmin(superAdmin: UsersOptions['superAdmin']): Record<string, string> | undefined {
        const errors: Record<string, string> = {}
        const email = superAdmin.email?.trim()
        if (!email) errors.email = 'Super admin email is required'
        //make sure email is lowercase and does not contain invalid chars
        if (/[^a-zA-Z0-9@._-]/.test(email)) errors.email = 'Super admin email contains invalid characters'



        const password = superAdmin.password?.trim()
        if (!password) errors.password = 'Super admin password is required'

        return Object.keys(errors).length ? errors : undefined
    }
}
