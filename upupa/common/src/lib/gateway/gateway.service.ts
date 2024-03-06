import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { filter, map, skip } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '@upupa/auth';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export type GatewayTransaction<T = any> = {
    transactionId: string;
    payload: T;
};

export type GatewaySubscriptionOptions = {
    observe: undefined | 'events';
};

type SocketEvent<T = unknown> = {
    event: string;
    payload: T;
    callback: (any) => void;
};


export class GatewayClient {
    public socket: Socket;
    private _url: string;
    private _events$ = new ReplaySubject<SocketEvent>(1);
    private _cache: { [event: string]: Observable<SocketEvent> } = {};
    private _reconnect_failed = 0;
    private _init = false;
    private _authSub: Subscription;
    private _onEventsSubscriptions: string[] = [];

    constructor(public auth: AuthService, public name = "DEFAULT") { }

    static create(url: string, auth: AuthService, name = "DEFAULT") {
        const gateway = new GatewayClient(auth, name)
        gateway.connect(url)
        return gateway
    }

    refresh(): Socket {
        if (!this._url) throw 'connect must be called before connection can be refreshed';
        this.socket?.disconnect();

        const transports = ['websocket', 'polling']; // use WebSocket first, if available
        this.socket = io(this._url, {
            transports,
            auth: { token: this.auth.get_token() },
            query: { client: this.name, device: this.auth.deviceService.getDeviceId() }
        });
        this.socket.on('connection', () => {
            this._reconnect_failed = 0
        });

        if (!this._init) {
            this._init = true; //this is supposed to be a one time subscription
            this.socket.on('reconnect_failed', () => {
                this._reconnect_failed++;
                if (this._reconnect_failed > 15) {
                    this.socket.disconnect();
                    this.refresh();
                }
            });
        }

        this._reSubscribeOnEvents();

        return this.socket;
    }

    connect(url: string): Socket<DefaultEventsMap, DefaultEventsMap> {
        this._url = url;
        console.log('connecting to', url);
        if (!this._authSub)
            this._authSub = this.auth.user$
                .pipe(
                    skip(1) // because user$ emits immediately upon subsection we don't want to reconnect right away
                )
                .subscribe(() => this.reconnect()); //keep refreshing access token

        return this.refresh();
    }

    private reconnect() {
        if (this.socket) {
            this.socket.auth = { token: this.auth.get_token() };
            return this.socket.disconnect().connect();
        } else return this.refresh();
    }

    send<T = unknown, R = unknown>(event: string, payload: T): Promise<R> {
        return new Promise<R>((resolve) => {
            const msg = { payload };
            this.socket.emit(event, msg, (res) => {
                resolve(res);
            });
        });
    }

    emit<T = unknown>(event: string, payload: T): Socket<DefaultEventsMap, DefaultEventsMap> {
        const msg = { payload };
        return this.socket.emit(event, msg);
    }

    on<T>(event: string): Observable<T>;
    on<T>(
        event: string,
        options: { observe: 'events' }
    ): Observable<SocketEvent<T>>;
    on<T>(
        event: string,
        options?: GatewaySubscriptionOptions
    ): Observable<SocketEvent<T>> | Observable<T> {
        if (!this._onEventsSubscriptions.includes(event))
            this._onEventsSubscriptions.push(event);
        return this._on<T>(event, options?.observe) as any;
    }

    private _reSubscribeOnEvents() {
        for (const event of this._onEventsSubscriptions) {
            this.socket.on(event, (payload: any, callback) =>
                this._events$.next({ event, payload, callback })
            );
        }
    }

    private _on<T>(
        event: string,
        observe?: GatewaySubscriptionOptions['observe']
    ): Observable<T> | Observable<SocketEvent<T>> {
        if (!this._cache[event]) {
            this.socket.on(event, (payload: T, callback: (any) => void) =>
                this._events$.next({ event, payload, callback })
            );
            this._cache[event] = this._events$.pipe(filter((e) => e.event === event));
        }
        const rx = this._cache[event] as Observable<SocketEvent<T>>;
        return observe == 'events' ? rx : rx.pipe(map((e) => e.payload));
    }
}
