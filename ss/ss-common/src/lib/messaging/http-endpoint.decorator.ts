import { All, applyDecorators, Delete, Get, HttpException, HttpStatus, Patch, Post, Put, Type } from '@nestjs/common'
import { EndpointsInfo } from "./endpoints-info.fun"
import { EndPointOptions } from './endpoint.decorator'
import { ENDPOINT_OPERATION, ENDPOINT_PATH } from './constants';


export function HttpEndpoint(route: EndPointOptions['http'], meta?: Pick<EndPointOptions, 'operation' | 'path'>): MethodDecorator {
    type NewType = Type<unknown>;

    let httpDecorator: MethodDecorator;
    const _route = route!
    const path = _route.path.startsWith('/') ? _route.path.substring(1) : _route.path
    switch (_route.method) {
        case undefined:
        case 'GET': httpDecorator = Get(path); break
        case 'POST': httpDecorator = Post(path); break
        case 'PUT': httpDecorator = Put(path); break
        case 'PATCH': httpDecorator = Patch(path); break
        case 'DELETE': httpDecorator = Delete(path); break
        case 'ALL': httpDecorator = All(path); break
        default: throw new HttpException('Invalid http method', HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return applyDecorators((target: any, property: string, descriptor: PropertyDescriptor) => {
        const method = route.method ?? 'GET';
        const path = meta.path ?? route.path;
        const operation = meta?.operation ?? property;
        const t = target as any
        Reflect.defineMetadata(ENDPOINT_PATH, path, t[property!])
        Reflect.defineMetadata(ENDPOINT_OPERATION, operation, t[property])
        //prefix cannot be known at this point, it must be calculated during app bootstrap
        EndpointsInfo.httpEndpoints.push({
            controller: target, handler: property, descriptor, httpPath: route.path, method, operation, path, prefix: undefined,
            fullPath: path
        })
    }, httpDecorator)

}
