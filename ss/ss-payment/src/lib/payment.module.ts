import {
  DynamicModule,
  Inject,
  OnModuleInit,
  Provider,
} from '@nestjs/common';
import { CommonModule } from '@ss/common';
import { DataModule, DataService } from '@ss/data';
import { JobSchedulerModule } from '@ss/job';
import { PaymentConfig } from './payment.config';
import { PaymentController } from './payment.controller';
import { ManualPaymentProvider } from './payment.providers/_base';

import { PaymentService } from './payment.svr';
import transactionSchema from './transaction.schema';

const _defaultconfig = new PaymentConfig();

const _providers = [PaymentService, ManualPaymentProvider];
const _imports = [CommonModule, DataModule, JobSchedulerModule];

export class PaymentModule implements OnModuleInit {
  constructor(public readonly data: DataService) {}
  onModuleInit() {
    this.data.addModel('transaction', transactionSchema);
  }

  static register(
    config: PaymentConfig,
    ...providers: Provider[]
  ): DynamicModule {
    config ??= _defaultconfig;

    return {
      module: PaymentModule,
      controllers: [PaymentController],
      imports: [..._imports],
      exports: [..._providers, ...providers],
      providers: [
        {
          provide: PaymentConfig,
          useValue: config,
        },
        ..._providers,
        ...providers,
      ],
    };
  }
}
