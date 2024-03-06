import { applyDecorators, Type } from "@nestjs/common"
import { EventPattern } from "@nestjs/microservices"
import { EndpointsInfo } from "./endpoints-info.fun";


export function EventHandler(eventPattern: string, operation?: string, path?: string): MethodDecorator {
    return applyDecorators((target: Type<unknown>, property: string, descriptor: PropertyDescriptor) => {
        if (!EndpointsInfo.events.find(x => x.event === eventPattern)) {
            const pattern = eventPattern.includes('*') ? new RegExp(`^${eventPattern.replace(/\*/g, '.+')}$`) : undefined
            EndpointsInfo.events.push({
                controller: target, handler: property, descriptor, event: eventPattern, operation: operation ?? eventPattern, pattern, path, prefix: '',
                fullPath: ""
            })
        }
    }, EventPattern(eventPattern))
}
