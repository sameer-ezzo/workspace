import { applyDecorators, Type } from '@nestjs/common';
import { SubscribeMessage } from '@nestjs/websockets';
import { EndpointsInfo } from './endpoints-info.fun';
import { EndPointOptions } from './endpoint.decorator';



export function WebSocketsEndpoint(event: EndPointOptions['ws'], operation?: string, path?: string): MethodDecorator {
    return applyDecorators((target: Type<unknown>, property: string, descriptor: PropertyDescriptor) => {
        const pattern = event.includes('*') ? new RegExp(`^${event.replace(/\*+/g, '.+')}$`) : undefined;
        EndpointsInfo.wsEndpoints.push({
            controller: target, prefix: '', handler: property, descriptor, event, operation: operation ?? event, pattern, path,
            fullPath: ''
        });
    }, SubscribeMessage(event));
}
