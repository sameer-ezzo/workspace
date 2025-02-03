import { DynamicModule, OnModuleInit, Provider } from "@nestjs/common";
import { DataService } from "@ss/data";
import { PaymentConfig } from "./payment.config";
import { PaymentController } from "./payment.controller";
import { ManualPaymentProvider } from "./payment.providers/_base";
import { PaymentService } from "./payment.svr";
import transactionSchema from "./transaction.schema";
import { MongooseModule } from "@nestjs/mongoose";

const _defaultconfig = new PaymentConfig();

const _providers = [PaymentService, ManualPaymentProvider];

export class PaymentModule implements OnModuleInit {
    constructor(public readonly data: DataService) {}
    async onModuleInit() {
        // await this.data.addModel('transaction', transactionSchema);
    }

    static register(config: PaymentConfig, ...providers: Provider[]): DynamicModule {
        config ??= _defaultconfig;

        return {
            module: PaymentModule,
            controllers: [PaymentController],
            imports: [MongooseModule.forFeature([{ name: "transaction", schema: transactionSchema }], "DB_DEFAULT")],
            exports: [..._providers, ...providers, MongooseModule],
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
