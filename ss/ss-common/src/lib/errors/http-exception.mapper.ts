import { HttpException, HttpStatus } from "@nestjs/common";
import { AppError } from "./app.error";

type ErrorShape = {
    message?: string;
    status?: number;
    statusCode?: number;
    code?: string | number;
    details?: unknown;
    error?: unknown;
    errInfo?: unknown;
    keyPattern?: Record<string, number>;
    [key: string]: unknown;
};

const statusByCode: Record<string, HttpStatus> = {
    BAD_REQUEST: HttpStatus.BAD_REQUEST,
    INVALID_ARGUMENTS: HttpStatus.BAD_REQUEST,
    INVALID_ARGS: HttpStatus.BAD_REQUEST,
    INVALID_DATA: HttpStatus.BAD_REQUEST,
    INVALID_ID: HttpStatus.BAD_REQUEST,
    INVALID_PATH: HttpStatus.BAD_REQUEST,
    MISSING_ARGUMENTS: HttpStatus.BAD_REQUEST,
    MISSING_ID: HttpStatus.BAD_REQUEST,
    MISSING_INFO: HttpStatus.BAD_REQUEST,
    NOT_FOUND: HttpStatus.NOT_FOUND,
    RESOURCE_NOT_FOUND: HttpStatus.NOT_FOUND,
    UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
    UNAUTHENTICATED: HttpStatus.UNAUTHORIZED,
    FORBIDDEN: HttpStatus.FORBIDDEN,
    ACCESS_DENIED: HttpStatus.FORBIDDEN,
    ALREADY_EXISTS: HttpStatus.CONFLICT,
    CONFLICT: HttpStatus.CONFLICT,
};

const mongoErrorByCode: Record<number, { status: HttpStatus; code: string; message: string }> = {
    13: { status: HttpStatus.FORBIDDEN, code: "ACCESS_DENIED", message: "You do not have permission to perform this operation." },
    26: { status: HttpStatus.NOT_FOUND, code: "RESOURCE_NOT_FOUND", message: "The specified collection or database does not exist." },
    50: { status: HttpStatus.REQUEST_TIMEOUT, code: "TIMEOUT", message: "The operation took too long to execute." },
    11600: { status: HttpStatus.SERVICE_UNAVAILABLE, code: "INTERRUPTED", message: "The operation was interrupted. Please retry." },
    4: {
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: "TOO_MANY_REQUESTS",
        message: "The operation failed due to rate limiting. Please retry later.",
    },
    112: { status: HttpStatus.FORBIDDEN, code: "WRITE_NOT_ALLOWED", message: "Writes are not allowed on this node or database." },
    2: { status: HttpStatus.BAD_REQUEST, code: "BAD_VALUE", message: "Invalid value or argument provided in the query." },
    251: {
        status: HttpStatus.BAD_REQUEST,
        code: "NO_SUCH_TRANSACTION",
        message: "The transaction does not exist or has expired.",
    },
    244: {
        status: HttpStatus.CONFLICT,
        code: "TRANSIENT_TRANSACTION_ERROR",
        message: "A transient error occurred during the transaction. Please retry.",
    },
    225: {
        status: HttpStatus.REQUEST_TIMEOUT,
        code: "TRANSACTION_TIMEOUT",
        message: "The transaction exceeded its lifetime limit.",
    },
    8000: { status: HttpStatus.CONFLICT, code: "WRITE_CONFLICT", message: "A write conflict occurred. Please retry the operation." },
    67: { status: HttpStatus.BAD_REQUEST, code: "INDEX_CREATION_ERROR", message: "Failed to create index. Check your index options and fields." },
    85: {
        status: HttpStatus.CONFLICT,
        code: "INDEX_OPTIONS_CONFLICT",
        message: "Conflicting index options detected. Check your index definitions.",
    },
    173: {
        status: HttpStatus.BAD_REQUEST,
        code: "TEXT_SEARCH_NOT_ENABLED",
        message: "Text search is not enabled on the specified field or collection.",
    },
    63: {
        status: HttpStatus.CONFLICT,
        code: "STALE_SHARD_VERSION",
        message: "Shard version is stale. Retrying the operation may resolve this.",
    },
    150: {
        status: HttpStatus.BAD_REQUEST,
        code: "SHARD_KEY_NOT_FOUND",
        message: "The shard key is missing in the operation. Ensure the shard key is included.",
    },
    72: { status: HttpStatus.BAD_REQUEST, code: "INVALID_OPTIONS", message: "Invalid options were provided in the command." },
};

function normalizeErrorCode(value: unknown): string | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value !== "string") return undefined;
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return normalized.length ? normalized : undefined;
}

function isErrorShape(value: unknown): value is ErrorShape {
    return typeof value === "object" && value !== null;
}

function getStatus(error: ErrorShape): HttpStatus {
    const directStatus = Number(error.status ?? error.statusCode);
    if (Number.isInteger(directStatus) && directStatus >= 400 && directStatus < 600) {
        return directStatus as HttpStatus;
    }

    const codeFromError = typeof error.code === "string" ? error.code : "";
    const codeFromMessage = typeof error.message === "string" ? error.message : "";
    const normalizedCode = (codeFromError || codeFromMessage).toUpperCase().replace(/[^A-Z0-9]+/g, "_");

    if (statusByCode[normalizedCode]) {
        return statusByCode[normalizedCode];
    }

    if (normalizedCode.includes("NOT_FOUND")) return HttpStatus.NOT_FOUND;
    if (normalizedCode.includes("UNAUTHORIZED") || normalizedCode.includes("UNAUTHENTICATED")) return HttpStatus.UNAUTHORIZED;
    if (normalizedCode.includes("FORBIDDEN") || normalizedCode.includes("ACCESS_DENIED")) return HttpStatus.FORBIDDEN;
    if (normalizedCode.includes("CONFLICT") || normalizedCode.includes("ALREADY")) return HttpStatus.CONFLICT;
    if (normalizedCode.includes("INVALID") || normalizedCode.includes("MISSING") || normalizedCode.includes("BAD_REQUEST")) return HttpStatus.BAD_REQUEST;

    return HttpStatus.INTERNAL_SERVER_ERROR;
}

export function toHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) return error;

    if (error instanceof AppError) {
        const normalizedCode = normalizeErrorCode(error.code ?? error.message) ?? "INTERNAL_SERVER_ERROR";
        return new HttpException(
            {
                message: error.message,
                code: normalizedCode,
                details: error.details,
            },
            error.status ?? getStatus({ message: error.message, code: error.code, status: error.status }),
        );
    }

    if (typeof error === "string") {
        const status = getStatus({ message: error });
        return new HttpException({ message: error, code: normalizeErrorCode(error) ?? "INTERNAL_SERVER_ERROR" }, status);
    }

    if (!isErrorShape(error)) {
        return new HttpException({ message: "Internal server error", code: "INTERNAL_SERVER_ERROR" }, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const numericCode = typeof error.code === "number" ? error.code : Number.NaN;
    if (Number.isInteger(numericCode) && mongoErrorByCode[numericCode]) {
        const mapped = mongoErrorByCode[numericCode];
        return new HttpException(
            {
                code: mapped.code,
                message: mapped.message,
            },
            mapped.status,
        );
    }

    if (numericCode === 11000) {
        const keyPattern = error["keyPattern"] as Record<string, number> | undefined;
        const keys = keyPattern ? Object.entries(keyPattern).filter(([, v]) => v === 1).map(([k]) => k) : [];
        return new HttpException(
            {
                    code: "CONSTRAINT_VIOLATION",
                message: `Cannot create duplicate ${keys.join()}`,
                type: "UNIQUE",
                keys,
            },
            HttpStatus.CONFLICT,
        );
    }

    if (numericCode === 121) {
        return new HttpException(
            {
                    code: "VALIDATION_ERROR",
                message: error.errInfo,
            },
            HttpStatus.BAD_REQUEST,
        );
    }

    const status = getStatus(error);
    const message = typeof error.message === "string" && error.message.length > 0 ? error.message : "Internal server error";
    const code = normalizeErrorCode(error.code ?? message) ?? "INTERNAL_SERVER_ERROR";

    return new HttpException(
        {
            message,
            code,
            details: error.details ?? error.error,
        },
        status,
    );
}
