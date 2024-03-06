import { Socket, Server } from "socket.io"
import { Observable, Subject } from "rxjs"
import { filter } from 'rxjs/operators'
import { Inject, Injectable } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'
import { Deferred, Principle } from "@noah-ark/common"
import * as jwt from "jsonwebtoken"
import { __secret } from "../secret.fun"
import { logger } from "../logger"

type RemoteSocket = Awaited<ReturnType<ReturnType<Server['in']>['fetchSockets']>>[number]

export type WsEvent<T = any> = {
    event: string
    id: string
    payload: T
    socket: Socket
    callback: (ack: any) => void
    msg: {
        payload: T
        principle: string
    }
}

function verifyToken(token: string): Principle {
    const secret = __secret()
    try {
        return jwt.verify(token, secret) as Principle;
    } catch (error) {
        return undefined
    }
}

@Injectable()
export class WebsocketsGateway {


    private _onDisconnected = new Subject<Socket>()
    private _onConnected = new Subject<Socket>()
    disconnected$ = this._onDisconnected.asObservable()
    connected = this._onConnected.asObservable()


    private _server: Server
    ioServerPromise: Promise<Server>

    constructor(public adapterHost: HttpAdapterHost, @Inject('IO_SERVER_PROMISE') deferredServer: Deferred<Server>) {
        this.ioServerPromise = deferredServer?.promise
        if (!deferredServer) logger.error("Websocket server could not be injected!")
    }


    async getServer(): Promise<Server> {
        if (this._server) return this._server
        this._server = await this.ioServerPromise
        logger.info("Websockets server started successfully")
        this._server.on('connection', (client, ...args) => this.handleConnection(client, args))
        return this._server
    }

    async echo(client: Socket, message: { event: string } & Record<string, unknown>) {
        return this.to(client.id, message.event ?? 'echo', { ...message, pid: process.pid });
    }

    async auth(socket: Socket) {
        const token = socket.handshake.auth?.token
        const principle = verifyToken(token)
        if (principle) {
            socket.data = socket.data ? { ...socket.data, principle } : { principle }
            await socket.join(principle.sub)
        }
    }

    async join(id: string, room: string) {
        const server = await this.getServer()
        const sockets = server.of('/').sockets
        const socket = sockets.get(id)!
        return socket.join(room)
    }

    async room(room: string): Promise<RemoteSocket[]> {
        const server = await this.getServer()
        const sockets = await server.in(room).fetchSockets()
        return [...sockets]
    }


    handleDisconnect(socket: Socket, ...args: any[]) {
        this._onDisconnected.next(socket);
    }

    handleConnection(socket: Socket, ...args: any[]) {
        if (socket.handshake.auth?.token) this.auth(socket)
        socket.on('disconnect', (...args) => this.handleDisconnect(socket, args))
        //catch up wth already registered events
        this._on.forEach(event => socket.on(event, (msg, callback) => {
            this._subject.next({ event, payload: msg.payload, msg, id: socket.id, socket, callback })
        }))
        this._onConnected.next(socket)
    }


    async broadcast<T = any>(event: string, payload: T) {
        const server = await this.getServer()
        return server.emit(event, payload)
    }

    async of<T = any>(path: string, event: string, payload: T) {
        const server = await this.getServer()
        return server.of(path).emit(event, payload)
    }



    async to<T = any>(id: string, event: string, payload: T, options = { timeout: 1000 }): Promise<{ ack: any, id: string, socket: RemoteSocket, error?: any }[]> {
        const server = await this.getServer()
        const sockets = await server.in(id).fetchSockets() // we're not using server.to directly because it behaves like promise.all and thus ack are either collected for all sockets or nothing
        return this.toSockets(sockets, event, payload, options)

    }

    async toSockets<T = any>(sockets: RemoteSocket[], event: string, payload: T, options = { timeout: 3000 }): Promise<{ ack: any, id: string, socket: RemoteSocket, error?: any }[]> {
        const tasks = sockets.map((socket: RemoteSocket) => {
            return new Promise<{ ack: any, id: string, socket: RemoteSocket, error?: any }>((resolve) => {
                if (options.timeout && socket instanceof Socket) socket = socket.timeout(options.timeout) as any //remote socket is a socket opened on another server which does not support broadcasting operators like normal socket
                socket.emit(event, payload, (error: Error, ack: any) => {
                    resolve({ ack, id: socket.id, socket, error })
                })
            })
        });

        return Promise.all(tasks)

    }

    _subject = new Subject<WsEvent>();
    _on: string[] = [];
    async on<T = any>(event: string): Promise<Observable<WsEvent<T>>> {
        this._on.push(event) //future sockets will consume this array
        const server = await this.getServer()


        if (server) { //if server is ready subscribe to event coming from existing sockets
            for (const [, socket] of server.of("/").sockets) {
                socket.on(event, (id, msg, callback) => {

                    this._subject.next({ id, event, payload: msg.payload, socket, msg, callback });
                })
            }
        }

        return this._subject.pipe(filter(x => x.event === event))

    }


}
