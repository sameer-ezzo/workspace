import { DynamicModule, Provider, Scope } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { ClientsModule, ClientProvider, Transport, ClientRedis, RedisOptions } from "@nestjs/microservices";

import { BrokerController } from "./messaging/broker.controller";
import { Broker, BROKER_CLIENT } from "./messaging/broker.svr";
import { EventBusService } from "./messaging/event-bus.service";

import { RedisClient } from "./redis";
import { parseRedisConfig } from "./read-default-redis-client-config";
import { logger } from "./logger";

export type RedisConfig = `REDIS_${string}`;
export class SSConfig {
    static readonly default = new SSConfig();
    constructor(
        public readonly broker: "bus" | RedisConfig = "bus",
        public readonly options?: ClientProvider,
    ) {}
}

const redisClients = Object.keys(process.env)
    .filter((name) => name.startsWith("REDIS_") && process.env[name]?.includes(":"))
    .map((provide: string) => {
        return {
            provide,
            useFactory: () => RedisClient.create(provide, parseRedisConfig(provide)),
            scope: Scope.TRANSIENT,
        };
    });

const providers: Provider[] = [
    EventBusService,
    Broker,
    {
        provide: "IO_SERVER_PROMISE",
        useFactory: (ah: HttpAdapterHost) => ah.httpAdapter?.getInstance().get("io-server"),
        inject: [HttpAdapterHost],
    },
    // WebsocketsGateway,
    ...redisClients,
];

// PROVIDE THE DEFAULT REDIS CLIENT (IF ANY)
if (redisClients.length)
    providers.push({
        provide: RedisClient,
        useFactory: (redis) => {
            logger.info(`REDIS:DEFAULT:PROVIDER: ${redis.name}`);
            return redis;
        },
        inject: ["REDIS_DEFAULT"],
        scope: Scope.TRANSIENT,
    });

const controllers = [BrokerController];
let BROKER_CLIENT_PROVIDER = {
    provide: BROKER_CLIENT,
    useClass: EventBusService,
} as Provider;

export class CommonModule {
    static register(config: Partial<SSConfig> = SSConfig.default): DynamicModule {
        const _config = { ...SSConfig.default, ...config };
        const imports = [];
        if (_config.broker.startsWith("REDIS_")) {
            const redisOptions = parseRedisConfig(_config.broker)[0];
            BROKER_CLIENT_PROVIDER = {
                provide: BROKER_CLIENT,
                useFactory: () => {
                    redisOptions.port = +redisOptions.port || 6379;
                    const client = new ClientRedis(redisOptions as unknown as RedisOptions["options"]);
                    return client;
                },
            } as Provider;
            imports.push(
                ClientsModule.register([
                    {
                        name: BROKER_CLIENT,
                        transport: Transport.REDIS,
                        ...redisOptions,
                    },
                ]),
            );
        }

        const module = {
            global: true,
            module: CommonModule,
            imports: [...imports],
            controllers: [...controllers],
            providers: [...providers, BROKER_CLIENT_PROVIDER],
            exports: [...providers, BROKER_CLIENT_PROVIDER],
        } as DynamicModule;

        return module;
    }
}
