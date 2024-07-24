import { DynamicModule, Provider, Module, Scope, FactoryProvider } from "@nestjs/common"
import { HttpAdapterHost } from "@nestjs/core"
import { ClientsModule, ClientProvider, Transport, ClientRedis } from "@nestjs/microservices"

import { GeoipSrvService } from "./geoip/geoip-srv/geoip-srv.service"
import { GeoipController } from "./geoip/geoip/geoip.controller"
import { BrokerController } from "./messaging/broker.controller"
import { Broker, BROKER_CLIENT } from "./messaging/broker.svr"
import { EventBusService } from "./messaging/event-bus.service"

import { parseRedisConfig, RedisClient } from "./redis"
import { WebsocketsGateway } from "./ws/websockets.gateway"
export type RedisConfig = `REDIS_${string}`
export class SSConfig {
    static readonly default = new SSConfig()
    constructor(public readonly broker: 'bus' | RedisConfig = 'bus', public readonly options?: ClientProvider) { }
}

const redisClients = Object.keys(process.env)
    .filter(name => name.startsWith("REDIS_") && process.env[name].includes(":"))
    .map((provide: string) => {
        return {
            provide,
            useFactory: () => RedisClient.create(provide, parseRedisConfig(provide)),
            scope: Scope.TRANSIENT
        } as FactoryProvider
    })

const prod = process.env['NODE_PROD'] === 'production'
if (!prod && !redisClients.find(p => p.provide == 'REDIS_DEFAULT')) {
    const provide = "REDIS_DEFAULT"
    redisClients.push({
        provide,
        useFactory: () => RedisClient.create(provide, [{ host: 'localhost', port: 6379 }]),
        scope: Scope.TRANSIENT
    } as FactoryProvider
    )
}

const providers: Provider[] = [
    GeoipSrvService,
    EventBusService,
    Broker,
    {
        provide: "IO_SERVER_PROMISE",
        useFactory: (ah: HttpAdapterHost) => ah.httpAdapter?.getInstance().get('io-server'),
        inject: [HttpAdapterHost]
    },
    WebsocketsGateway,
    ...redisClients,
    { provide: RedisClient, useFactory: (redis) => redis, inject: ['REDIS_DEFAULT'], scope: Scope.TRANSIENT },

]



const controllers = [BrokerController, GeoipController]
let BROKER_CLIENT_PROVIDER = { provide: BROKER_CLIENT, useClass: EventBusService } as Provider
@Module({
    controllers: [...controllers],
    imports: [],
    providers: [...providers, BROKER_CLIENT_PROVIDER],
    exports: [...providers]
})
export class CommonModule {
    static register(config: Partial<SSConfig> = SSConfig.default): DynamicModule {
        const _config = { ...SSConfig.default, ...config }
        const imports = []
        if (_config.broker.startsWith("REDIS_")) {
            const redisOptions = parseRedisConfig(_config.broker)[0]
            BROKER_CLIENT_PROVIDER = {
                provide: BROKER_CLIENT, useFactory: () => new ClientRedis(redisOptions)
            } as Provider
            imports.push(ClientsModule.register([{ name: BROKER_CLIENT, transport: Transport.REDIS, ...redisOptions }]))
        }

        const module = {
            module: CommonModule,
            imports: [...imports],
            controllers: [...controllers],
            providers: [...providers, BROKER_CLIENT_PROVIDER],
            exports: [...providers, BROKER_CLIENT_PROVIDER]
        } as DynamicModule

        return module;
    }

}