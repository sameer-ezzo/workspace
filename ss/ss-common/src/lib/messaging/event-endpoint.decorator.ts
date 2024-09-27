import { applyDecorators, Type } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { EndpointsInfo } from './endpoints-info.fun';

export function EventHandler(
    eventPattern: string,
    operation?: string,
    path?: string,
): MethodDecorator {
    return applyDecorators(
        createEventHandlerDecorator(eventPattern, operation, path),
        EventPattern(eventPattern),
    );
}

function createEventHandlerDecorator(
    eventPattern: string,
    operation?: string,
    path?: string,
): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        if (!isEventPatternRegistered(eventPattern)) {
            const pattern = createPattern(eventPattern);
            registerEventPattern(
                target,
                propertyKey,
                descriptor,
                eventPattern,
                operation,
                pattern,
                path,
            );
        }
    };
}

function isEventPatternRegistered(eventPattern: string): boolean {
    return EndpointsInfo.events.some((x) => x.event === eventPattern);
}

function createPattern(eventPattern: string): RegExp | undefined {
    return eventPattern.includes('*')
        ? new RegExp(`^${eventPattern.replace(/\*/g, '.+')}$`)
        : undefined;
}

function registerEventPattern(
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
    eventPattern: string,
    operation?: string,
    pattern?: RegExp,
    path?: string,
): void {
    EndpointsInfo.events.push({
        controller: target,
        handler: propertyKey as string,
        descriptor,
        event: eventPattern,
        operation: operation ?? eventPattern,
        pattern,
        path: path ?? '',
        prefix: '',
        fullPath: '',
    });
}
