import { ReplaySubject, Observable, Subject } from "rxjs";
import { logger } from "./logger";

import { Redis, RedisOptions, Cluster } from "ioredis";
import { RedisConnectionString } from "./read-default-redis-client-config";

const defaultOptions: RedisOptions = {
    enableAutoPipelining: true,
    showFriendlyErrorStack: !process.env["NODE_PROD"],
    maxRetriesPerRequest: null, //keep trying forever
    retryStrategy: (times) => (times < 5 ? 500 : 2000),
};

export class RedisClient {
    private static INSTANCE_COUNT = 0;
    private INSTANCE_COUNT = 0;
    private trace: string | null;

    static async create(name: string, nodes: RedisConnectionString[] = [], options: RedisOptions = defaultOptions): Promise<RedisClient> {
        const client = new RedisClient(name, options);
        await client.connect(nodes);
        return client;
    }

    redis!: Cluster | Redis;

    protected acceptPinging = false;

    protected readonly _connect$ = new ReplaySubject<boolean>(1);
    readonly connected$ = this._connect$.asObservable();

    constructor(
        public readonly name: string,
        public readonly options: RedisOptions = defaultOptions,
    ) {
        this.trace = new Error().stack ?? null;
        this.options = { ...defaultOptions, ...options };
        RedisClient.INSTANCE_COUNT++;
        this.INSTANCE_COUNT = RedisClient.INSTANCE_COUNT;
    }

    async connect(nodes: RedisConnectionString[] = []) {
        const host = nodes?.[0]?.host ?? this.options?.host;
        const port = nodes?.[0]?.port ?? this.options?.port ?? 6379;

        if (!host) throw new Error(`No redis nodes found for ${this.name}`);

        if (nodes.length > 1) logger.warn(`REDIS:CONNECTING ${this.name} @ redis://${nodes.map((n) => `${n.host}:${n.port}`).join(",")}`);
        else logger.warn(`REDIS:CONNECTING ${this.name} @ redis://${host}:${port}`);

        if (nodes.length > 1) {
            this.redis = new Cluster(nodes, this.options);
        } else {
            this.options.host = host;
            this.options.port = +port;
            const opts = Object.assign({}, nodes?.[0], this.options);
            this.redis = new Redis("redis://default:h8iY5N5W3yt7RhLN6Z0UPEZNOvwAqnjg@redis-10467.c328.europe-west3-1.gce.redns.redis-cloud.com:10467");
        }

        this.redis.on("connect", () => {
            this._connect$.next(true);
        });
        this.redis.on("disconnect", () => {
            this._connect$.next(false);
        });
        this.redis.on("error", (error: any) => {
            switch (error.code) {
                case "ECONNREFUSED":
                    logger.error(`Redis error: ${this.name}@${this.INSTANCE_COUNT} Unable to connect to ${error.address}:${error.port}`);
                    break;
                default:
                    logger.error(`Redis error: ${this.name}@${this.INSTANCE_COUNT}`, error);
                    this.quit();
                    break;
            }
            logger.verbose("CONSTRUCTION STACK", this.trace);
        });

        if (nodes.length > 1) logger.warn(`REDIS:CONNECTED ${this.name} @ redis://${nodes.map((n) => `${n.host}:${n.port}`).join(",")}`);
        else logger.warn(`REDIS:CONNECTED ${this.name} @ redis://${host}:${port}`);

        await this.redis.config("SET", "notify-keyspace-events", "KEA"); //TODO pass this in the options don't assume that expiry notification are always enabled
    }

    async quit(): Promise<void> {
        await this.redis.quit();
    }
    async ping(): Promise<void> {
        await this.redis.ping();
    }

    keys(pattern: string): Promise<string[]> {
        return this.redis.keys(pattern);
    }

    async get(key: string, ttl?: number): Promise<string | null> {
        if (ttl) {
            const res = await this.redis.multi().expire(key, ttl).get(key).exec();
            return res?.[1]?.[1] as string;
        }
        return this.redis.get(key);
    }

    set(key: string, value: string, ttl?: number): Promise<string> {
        return ttl ? this.redis.set(key, value, "EX", ttl) : this.redis.set(key, value);
    }

    expire(key: string, seconds: number): Promise<number> {
        return this.redis.expire(key, seconds);
    }
    async jsonSet(key: string, path: string, value: any, ttl?: number) {
        return await (this.redis as any).call(
            // "JSON.SET",
            "JSON.SET",
            key,
            `$${path}`,
            JSON.stringify(value),
        );
    }
    async jsonGet(key: string, path: any) {
        const val = await (this.redis as any).call(
            // "JSON.GET",
            "JSON.GET",
            key,
            `$${path}`,
        );
        try {
            return JSON.parse(val);
        } catch (e) {
            return val;
        }
    }

    async hashGet(key: string, path: any, json = false) {
        const val = await (this.redis as any).call(
            // "HGET",
            "HGET",
            key,
            path,
        );
        return json === true ? JSON.parse(val) : val;
    }

    publish(key: string, value: string): Promise<number> {
        return this.redis.publish(key, value);
    }
    async del(key: string) {
        await this.redis.del(key);
    }

    async zadd(key: string, value: { name: string; score: number }[]) {
        const _values = value.map(({ name, score }) => [score, name]).flat();
        return await this.redis.zadd(key, ..._values);
    }

    async zincrby(key: string, value: { name: string; score: number }) {
        return await this.redis.zincrby(key, value.score, value.name);
    }

    //Get all the values of a sorted set, from high to low
    async zrevrange(key: string, start: string | number, stop: string | number, withScores = true): Promise<{ id: string; score: number }[] | string[]> {
        const value = await this.redis.zrevrange(key, start, stop, "WITHSCORES");
        if (!withScores) return value;

        const _value: { id: string; score: number }[] = [];
        for (let index = 0; index < value.length; index++) {
            if (index % 2) continue;
            const element = { id: value[index] as string, score: +value[index + 1] };
            _value.push(element);
        }
        return _value;
    }

    private readonly _subs = new Map<string, Subject<string>>();
    async subscribe(channel: string): Promise<Observable<string>> {
        if (!this._subs.has(channel)) this._subs.set(channel, new Subject());

        this._onMessage();
        await this.redis.subscribe(channel);

        const sub = this._subs.get(channel);
        if (!sub) throw new Error(`Could not find subscription for ${channel}`);
        return sub.asObservable();
    }

    private _subscribedOnMessage = false;
    private _onMessage() {
        if (this._subscribedOnMessage) return;
        this.redis.on("message", (channel, message) => {
            logger.verbose(`message received redis://${this.name} CHANNEL:${channel}, MSG:${message}`, { channel, message });
            this._subs.get(channel)?.next(message);
        });
    }

    private readonly _psubs = new Map<string, Subject<{ channel: string; message: string }>>();
    async psubscribe(pattern: string): Promise<Observable<{ channel: string; message: string }>> {
        if (!this._psubs.has(pattern)) this._psubs.set(pattern, new Subject());

        this._onPMessage();
        await this.redis.psubscribe(pattern);

        const sub = this._psubs.get(pattern);
        if (!sub) throw new Error(`Could not find subscription for ${pattern}`);
        return sub.asObservable();
    }

    private _subscribedOnPMessage = false;
    private _onPMessage() {
        if (this._subscribedOnPMessage) return;
        this.redis.on("pmessage", (pattern, channel, message) => {
            logger.verbose(`pmessage received redis://${this.name} PATTERN:${pattern}, CHANNEL:${channel}, MSG:${message}`, { pattern, channel, message });
            this._psubs.get(channel)?.next({ channel, message });
        });
    }
}
