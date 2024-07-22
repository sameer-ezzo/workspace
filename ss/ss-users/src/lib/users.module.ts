import { DynamicModule, Module, Provider } from '@nestjs/common'
import { UsersController } from './users.controller'
import { CommonModule, logger } from '@ss/common'
import { DataModule } from '@ss/data'
import { RulesModule } from '@ss/rules'
import { Auth, AuthModule } from '@ss/auth'
import { isEmpty } from 'lodash'
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
        const superAdmin = options.superAdmin
        if (isEmpty(superAdmin.email)) throw 'Super admin email is not set'
        options.superAdmin.email = options.superAdmin.email.toLowerCase()

        if (isEmpty(superAdmin.password)) throw 'Super admin password is not set'

        const usersProviders = [...providers, { provide: 'USERS_OPTIONS', useValue: options }]
        return {
            module: UsersModule,
            providers: usersProviders,
            controllers: [UsersController],
        };
    }
}
