import { Injectable, ExecutionContext, applyDecorators, createParamDecorator, HttpException, HttpStatus, NestInterceptor, CallHandler, UseInterceptors } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ExtractIncomingMessage } from "@ss/common";

import { AccessType, SimplePermission, SimplePermissionType } from '@noah-ark/common';

function getPrinciple(ctx: ExecutionContext) {
    switch (ctx.getType()) {
        case 'http': return ctx.switchToHttp().getRequest().principle;
        case 'rpc': return ctx.switchToRpc().getData().principle;
        case 'ws': return ctx.switchToWs().getData().principle;
    }
}

export const Principle = createParamDecorator((_data: unknown, ctx: ExecutionContext) => getPrinciple(ctx));
export const Auth = () => UseInterceptors(AuthenticatedInterceptor);


@Injectable()
export class AuthenticatedInterceptor implements NestInterceptor {
    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        const msg = ExtractIncomingMessage(ctx);
        if (!msg.principle) throw new HttpException('not authenticated', HttpStatus.FORBIDDEN);
        return next.handle();
    }

}
