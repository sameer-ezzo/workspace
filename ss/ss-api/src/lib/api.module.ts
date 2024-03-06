import { DynamicModule, Module } from '@nestjs/common';
import { DataModule } from '@ss/data';
import { RulesModule } from '@ss/rules';
import { ApiController } from './api.controller';



@Module({
    controllers: [ApiController],
    imports: [RulesModule, DataModule]
})
export class ApiModule {
    static register(): DynamicModule {
        return {
            module: ApiModule,
            controllers: [ApiController]
        };
    }
}
