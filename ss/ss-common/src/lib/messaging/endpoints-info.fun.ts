
import { PATH_METADATA } from "@nestjs/common/constants"
import { logger } from "../logger";
import { join } from "path";
import { Type } from "@nestjs/common";


export function _controllerPrefix(target: Type<unknown>) {
    return Reflect.getMetadata(PATH_METADATA, target.constructor);
}
type Operation = string

export type EndpointInfoRecord = { controller: Type<any>, prefix: string, handler: string, descriptor: PropertyDescriptor, operation: string, pattern?: RegExp, path: string, fullPath: string }
export type HttpEndpointInfo = EndpointInfoRecord & { httpPath: string, method: string }

export class EndpointsInfo {
    static readonly commands: (EndpointInfoRecord & { command: string })[] = []
    static readonly events: (EndpointInfoRecord & { event: string })[] = []
    static readonly httpEndpoints: HttpEndpointInfo[] = []
    static readonly wsEndpoints: (EndpointInfoRecord & { event: string })[] = []

    static readonly _commandsCache: { [commandPattern: string]: Operation } = {}
    static readonly _eventsCache: { [eventPattern: string]: Operation } = {}
    static readonly _wsCache: { [eventPattern: string]: Operation } = {}
    static readonly _httpCache: { [route: string]: Operation } = {}

    static matchHttpRecord(path: string): HttpEndpointInfo[] {

        return EndpointsInfo.httpEndpoints.filter(x => x.pattern.test(path))
        // if (path.includes('*') || path.includes(':'))
        // else return EndpointsInfo.httpEndpoints.filter(x => x.path === path)
    }

}


export function completeEndpointsInfo() {

    for (const endpoint of EndpointsInfo.commands) { EndpointsInfo._commandsCache[endpoint.command] = endpoint.operation; }
    for (const endpoint of EndpointsInfo.events) { EndpointsInfo._eventsCache[endpoint.event] = endpoint.operation; }
    for (const endpoint of EndpointsInfo.wsEndpoints) { EndpointsInfo._wsCache[endpoint.event] = endpoint.operation; }

    for (const x of EndpointsInfo.httpEndpoints) {
        x.prefix = _controllerPrefix(x.controller);

        //check if enpoints have any undefined property
        if (x.prefix === undefined)
            logger.warn(`Undefined prefix for ${x.prefix ?? x.controller} ${x.method} ${x.path}`);
        if (x.method === undefined)
            logger.warn(`Undefined method for ${x.prefix ?? x.controller} ${x.method} ${x.path}`);
        if (x.path === undefined) {
            logger.warn(`Undefined path for ${x.prefix ?? x.controller} ${x.method} ${x.path}`);
            continue
        }

        if (x.path?.startsWith('/'))
            logger.warn(`Path should not start with / for ${x.prefix ?? x.controller} ${x.method} ${x.path}`);

        const p = join(x.prefix, x.path)
        const route = p.startsWith('/') ? p.substring(1) : p

        const [hasStar, hasParam] = [x.path.includes('*'), x.path.includes(':')];
        let patternString = route;
        if (hasStar)
            patternString = patternString.replace(/\*+/g, '.*');
        if (hasParam)
            patternString = patternString.replace(/:[^/]+/g, '[^/]+');
        //then replace :params
        x.pattern = new RegExp(`^${patternString}$`, 'i') //hasStar || hasParam ?  : undefined;
        EndpointsInfo._httpCache[`${x.method}:/${route}`] = x.operation;

    }

}
