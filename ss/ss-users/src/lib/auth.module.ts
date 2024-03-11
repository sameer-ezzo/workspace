import { Module, Provider } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { CommonModule } from '@ss/common'
import { DataModule } from '@ss/data'
import { RulesModule } from '@ss/rules'
import { AuthModule } from '@ss/auth'




const providers: Provider[] = [
    { provide: 'AUTH_DB', useExisting: process.env['DB_AUTH'] ? 'DB_AUTH' : 'DB_DEFAULT' }
]

@Module({
    controllers: [AuthController],
    providers: [...providers],
    exports: [...providers],
    imports: [AuthModule, RulesModule, DataModule, CommonModule],
})
export class UsersModule {
}
