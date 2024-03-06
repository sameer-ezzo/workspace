import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ENDPOINT_OPERATION, ExtractIncomingMessage } from "@ss/common";
import { Observable } from "rxjs";
import { AuthorizeService } from "./authorize.svr";


@Injectable()
export class AuthorizeInterceptor implements NestInterceptor {

    constructor(private reflector: Reflector, private authorizeService: AuthorizeService) { }

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        const msg = ExtractIncomingMessage(ctx);
        const handler = ctx.getHandler();
        const action = Reflect.getMetadata(ENDPOINT_OPERATION, handler)

        const { access, rule, source } = this.authorizeService.authorize(msg, action);
        if (access === 'deny')
            throw new HttpException({ rule, source, action, q: msg.query }, HttpStatus.FORBIDDEN);

        return next.handle();
    }
}


