import { applyDecorators, Type } from "@nestjs/common"
import { MessagePattern } from "@nestjs/microservices"
import { logger } from "../utils/logger";
import { EndpointsInfo } from "./endpoints-info.fun"


export function CommandHandler(commandPattern: string, operation?: string, path?: string): MethodDecorator {
    return applyDecorators(
        MessagePattern(commandPattern),
        (target: Type<unknown>, property: string, descriptor: PropertyDescriptor) => {
            operation ??= commandPattern;
            if (!EndpointsInfo.commands.find(x => x.command === commandPattern)) {

                const pattern = commandPattern.includes('*') ? new RegExp(`^${commandPattern.replace(/\*+/g, '.+')}$`) : undefined;
                EndpointsInfo.commands.push({
                    controller: target, prefix: '', handler: property, command: commandPattern, descriptor, operation, pattern, path,
                    fullPath: ""
                });
            }
            else
                logger.warn(`Command ${commandPattern} already registered; CONTROLLER:${target.constructor.name}  ACTION:${String(property)}`);
        });
}
