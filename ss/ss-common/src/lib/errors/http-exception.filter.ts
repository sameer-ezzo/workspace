import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { logger } from "../utils/logger";
import { toHttpException } from "./http-exception.mapper";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const httpException = toHttpException(exception);
        const status = httpException.getStatus();
        const raw = httpException.getResponse();
        const payload = typeof raw === "string" ? { message: raw } : (raw as Record<string, unknown>);

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            const message = exception instanceof Error ? exception.message : JSON.stringify(exception);
            const stack = exception instanceof Error ? exception.stack : undefined;
            logger.error(message, stack);
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request?.url,
            ...payload,
        });
    }
}
