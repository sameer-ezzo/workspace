import { applyDecorators, HttpException, HttpStatus } from '@nestjs/common'
import { HttpEndpoint as _HttpEndpoint}  from './http-endpoint.decorator'
import { HttpMethod } from "./model"
import { CommandHandler } from "./command-endpoint.decorator"
import { EventHandler } from "./event-endpoint.decorator"
import { WebSocketsEndpoint } from './web-sockets-endpoint.decorator'


export type EndPointOptions = {

    /**
     * @description The http routing info for this endpoint.
     */
    http?: { method?: HttpMethod; path: string }

    /**
     * @description Websocket event
    */
    ws?: string

    /**
     * @description The name of the command to be handled when emmited. This is espacially used in message based architecture (such as the case of Microservices)
     * There should be only one unique command handler per all services, and a warn log message will show up if there are more than one.
     */
    cmd?: string

    /**
     * @description The name of the event to be handled when emmited. Unlike the command, there can be more than one event handler per service, and response is extencted.
     */
    event?: string

    /**
     * @description The friendly name describing the function of the endpoint. It is used for logging, debugging, documentation, and setting permissions (Authorization).
     * @example "List users", "Impersonate", "Export assets"
     * @default the value will fallback to the command then event then path
     */
    operation?: string

    /**
     * @description Depending on the endpoint options, logical path replaces the http path in the business logic mentioned in "operation" field For other transports it adds the path info they miss.
     *
     * if http.path = `/v2/auth/login has` the path would be `/auth/login` ommiting the `/v2` segment as it does not play a role in the operation.
     */
    path?: string
}

export function EndPoint(options: string | EndPointOptions): MethodDecorator {
    if (!options) throw new HttpException('MISSING_ARGUMENT_OPTIONS', HttpStatus.INTERNAL_SERVER_ERROR)

    if (typeof options === 'string') {
        const path = options.startsWith('/') ? options : `/${options}`
        return applyDecorators(
            _HttpEndpoint({ method: 'POST', path: path }, { operation: 'POST', path: path }),
            EventHandler(path),
            WebSocketsEndpoint(path)
        )
    }

    else {
        const path = options.path ?? options.http?.path ?? options.cmd ?? options.event
        const httpPath = path.startsWith('/') ? path : `/${path}`
        return applyDecorators(
            ...(options.http ? [_HttpEndpoint(options.http, { operation: options.operation, path: httpPath })] : []),
            ...(options.cmd ? [CommandHandler(options.cmd, options.operation, path)] : []),
            ...(options.event ? [EventHandler(options.event, options.operation, path)] : [])
        )
    }
}


export function HttpEndpoint(path: string, method: HttpMethod = 'GET') {
    return EndPoint({ http: { path, method } })
}


