import * as SocketIORedis from 'socket.io-redis'
import { INestApplicationContext } from "@nestjs/common"
import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions } from 'socket.io'
import { createAdapter } from "@socket.io/redis-adapter"
import { logger } from '../logger'
import { RedisClient } from '../redis'


export class RedisIoAdapter extends IoAdapter {

    redisAdapter!: SocketIORedis.RedisAdapter

    constructor(app: INestApplicationContext, public readonly redisClient: RedisClient) {
        super(app)
    }

    override createIOServer(port: number, name: string, options?: ServerOptions) {
        logger.info("CREATING REDIS SOCKET ADAPTER")
        const pubClient = this.redisClient.redis
        const server = super.createIOServer(port, options)
        server.adapter(this.redisAdapter)
        const subClient = pubClient.duplicate();

        server.adapter(createAdapter(pubClient, subClient));
        server.listen(3000);
        return server
    }
}