import { Principle } from "./user";
import { File } from "./file";

export type IncomingMessage<TPayload = unknown> = {
    /**
     * @description a friendly name marking up the action being handled. It is used for authorization, logging, documentation etc...
     */
    operation?: string


    path: string
    query?: Record<string, string | string[]>

    payload?: TPayload

    /**
     * @description the authenticated principle sending the message. If null that means the message is not authenticated.
     */
    principle?: Principle

    /**
     * @description Additional data that can be passed with the message.
     */
    ctx: {
        transport?: 'http' | 'rpc' | 'ws'
        route?: string
        authProvider?: any, // HttpAuthenticationProvider from @ss/auth
    } & Record<string, unknown>
}


export type IncomingMessageStream<TPayload = unknown> = IncomingMessage<TPayload> & { streams: Promise<File>[] };