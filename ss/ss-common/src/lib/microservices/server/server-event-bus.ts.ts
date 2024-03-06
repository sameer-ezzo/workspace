import { isUndefined } from '@nestjs/common/utils/shared.utils';
import { CustomTransportStrategy, IncomingRequest, RedisOptions, Server, Transport } from '@nestjs/microservices';
import { BaseRpcContext } from '@nestjs/microservices/ctx-host/base-rpc.context';
import { Observable } from 'rxjs';
import { EventBusService } from '../../messaging/event-bus.service';

export const REDIS_DEFAULT_URL = 'redis://localhost:6379';
export const CONNECT_EVENT = 'connect';
export const DISCONNECT_EVENT = 'disconnect';
export const CONNECT_FAILED_EVENT = 'connectFailed';
export const MESSAGE_EVENT = 'pmessage';
export const DATA_EVENT = 'data';
export const ERROR_EVENT = 'error';
export const CLOSE_EVENT = 'close';

export const CANCEL_EVENT = 'cancelled';
export const NO_MESSAGE_HANDLER = `There is no matching message handler defined in the remote service.`;
export const NO_EVENT_HANDLER = `There is no matching event handler defined in the remote service.`;
export const DISCONNECTED_RMQ_MESSAGE = `Disconnected from RMQ. Trying to reconnect.`;





type EventBusContextArgs = [string, string];

export class EventBusContext extends BaseRpcContext<EventBusContextArgs> {
    constructor(args: EventBusContextArgs) {
        super(args);
    }

    /**
     * Returns the name of the channel.
     */
    getChannel() {
        return this.args[0];
    }

    getSubject() {
        return this.args[1];
    }
}

export class ServerEventBus extends Server implements CustomTransportStrategy {
    public readonly transportId = -1 as Transport | symbol;

    private subClient: EventBusService;
    private pubClient: EventBusService;
    private isExplicitlyTerminated = false;

    constructor() {
        super();
        this.initializeSerializer({});
        this.initializeDeserializer({});
    }

    emit(pattern: string, payload: any, source?: any): Observable<never> {
        return this.pubClient.emit(pattern, payload, source)
    }

    // send(pattern: string, payload: any, source?: any): Observable<any> {
    //     return this.pubClient.send(pattern, payload, source)
    // }

    public listen(callback: (err?: unknown, ...optionalParams: unknown[]) => void) {
        try {
            this.subClient = this.createRedisClient();
            this.pubClient = this.createRedisClient();

            this.handleError(this.pubClient);
            this.handleError(this.subClient);
            this.start(callback);
        } catch (err) {
            callback(err);
        }
    }

    public start(callback?: () => void) {
        this.bindEvents(this.subClient, this.pubClient);
        this.subClient.on(CONNECT_EVENT, callback);

    }

    public bindEvents(subClient: EventBusService, pubClient: EventBusService) {
        subClient.on(MESSAGE_EVENT, this.getMessageHandler(pubClient).bind(this));
        const subscribePatterns = [...this.messageHandlers.keys()];
        subscribePatterns.forEach(pattern => {
            const { isEventHandler } = this.messageHandlers.get(pattern);
            subClient.on(
                isEventHandler ? pattern : this.getRequestPattern(pattern),
            );
        });
    }

    public close() {
        this.isExplicitlyTerminated = true
    }

    public createRedisClient(): EventBusService {
        return new EventBusService();
    }

    public getMessageHandler(pub: EventBusService) {
        return async (channel: string, subject: string, buffer: string | any) =>
            this.handleMessage(channel, subject, buffer, pub);
    }

    public async handleMessage(
        channel: string,
        subject: string,
        buffer: string | any,
        pub: EventBusService,
    ) {
        const rawMessage = this.parseMessage(buffer);
        const packet = await this.deserializer.deserialize(rawMessage, { channel });
        const redisCtx = new EventBusContext([channel, subject]);

        if (isUndefined((packet as IncomingRequest).id)) {
            return this.handleEvent(channel, packet, redisCtx);
        }
        const publish = this.getPublisher(
            pub,
            channel,
            (packet as IncomingRequest).id,
        );
        const handler = this.getHandlerByPattern(channel);

        if (!handler) {
            const status = 'error';
            const noHandlerPacket = {
                id: (packet as IncomingRequest).id,
                status,
                err: NO_MESSAGE_HANDLER,
            };
            return publish(noHandlerPacket);
        }
        const response$ = this.transformToObservable(
            await handler(packet.data, redisCtx),
        );
        response$ && this.send(response$, publish);
    }

    public getPublisher(pub: EventBusService, pattern: any, id: string) {
        return (response: any) => {
            Object.assign(response, { id });
            const outgoingResponse = this.serializer.serialize(response);

            return pub.emit(
                this.getReplyPattern(pattern),
                JSON.stringify(outgoingResponse),
            );
        };
    }

    public parseMessage(content: any): Record<string, any> {
        try {
            return JSON.parse(content);
        } catch (e) {
            return content;
        }
    }

    public getRequestPattern(pattern: string): string {
        return pattern;
    }

    public getReplyPattern(pattern: string): string {
        return `${pattern}.reply`;
    }

    public handleError(stream: any) {
        stream.on(ERROR_EVENT, (err: any) => this.logger.error(err));
    }

    public getClientOptions(): Partial<any> {
        const retry_strategy = () => this.createRetryStrategy()
        return { retry_strategy };
    }

    public createRetryStrategy(): undefined | number | void {
        return 0
    }
}