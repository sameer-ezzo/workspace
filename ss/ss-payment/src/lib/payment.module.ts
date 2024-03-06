import { DynamicModule, Module, Provider } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { tryParseInt } from '@noah-ark/common';
import { CommonModule, SSConfig } from '@ss/common';
import { DataModule } from '@ss/data';
import { JobSchedulerModule } from '@ss/job';
import { PaymentConfig } from './payment.config';
import { PaymentController } from './payment.controller';
import { ManualPaymentProvider } from './payment.providers/_base';

import { PaymentService } from './payment.svr';


const _defaultconfig = new PaymentConfig()

const _providers = [PaymentService, ManualPaymentProvider]
const _imports = [CommonModule, DataModule, JobSchedulerModule]

@Module({
    controllers: [PaymentController],
    imports: [..._imports],
    providers: [..._providers],
    exports: [..._providers],
})
export class PaymentModule {

    static register(config: PaymentConfig, ...providers: Provider[]): DynamicModule {
        config ??= _defaultconfig

        return {
            module: PaymentModule,
            controllers: [PaymentController],
            imports: [..._imports],
            exports: [..._providers, ...providers],
            providers: [
                {
                    provide: PaymentConfig,
                    useValue: config
                },
                ..._providers,
                ...providers
            ]
        }
    }



}
