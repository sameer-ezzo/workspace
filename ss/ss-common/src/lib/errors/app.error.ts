import { HttpStatus } from "@nestjs/common";

export type AppErrorOptions = {
    code?: string | number;
    status?: HttpStatus;
    details?: unknown;
    cause?: unknown;
};

export class AppError extends Error {
    readonly code?: string | number;
    readonly status?: HttpStatus;
    readonly details?: unknown;
    readonly cause?: unknown;

    constructor(message: string, options?: AppErrorOptions) {
        super(message);
        this.name = "AppError";
        this.code = options?.code;
        this.status = options?.status;
        this.details = options?.details;
        this.cause = options?.cause;
    }

    static badRequest(message: string, details?: unknown) {
        return new AppError(message, { status: HttpStatus.BAD_REQUEST, details });
    }

    static unauthorized(message = "UNAUTHORIZED", details?: unknown) {
        return new AppError(message, { status: HttpStatus.UNAUTHORIZED, details });
    }

    static forbidden(message = "FORBIDDEN", details?: unknown) {
        return new AppError(message, { status: HttpStatus.FORBIDDEN, details });
    }

    static notFound(message = "NOT_FOUND", details?: unknown) {
        return new AppError(message, { status: HttpStatus.NOT_FOUND, details });
    }

    static conflict(message = "CONFLICT", details?: unknown) {
        return new AppError(message, { status: HttpStatus.CONFLICT, details });
    }
}
