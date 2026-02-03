const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m",
};
export enum levels {
    "error",
    "warn",
    "info",
    "http",
    "verbose",
    "debug",
    "silly",
}
const defaultLevel =
    process.env["LOG_LEVEL"] && !isNaN(+process.env["LOG_LEVEL"]) && levels[+process.env["LOG_LEVEL"]] !== undefined ? levels[+process.env["LOG_LEVEL"]] : levels.info;

import { LoggerService } from "@nestjs/common";

function isEpipe(err: unknown): boolean {
    return typeof err === "object" && err !== null && ("code" in err ? (err as any).code === "EPIPE" : false);
}

function safeConsole(fn: (...args: any[]) => void, ...args: any[]) {
    try {
        fn(...args);
    } catch (err) {
        // If the consumer closes stdout/stderr (common when piping or when parent process exits),
        // Node can throw EPIPE on console.*. Ignore it so the server can keep running.
        if (isEpipe(err)) return;
        throw err;
    }
}

export class NestLogger implements LoggerService {
    constructor(
        public scope?: string,
        public logLevel: levels = levels.info,
    ) {}

    log(message: any, ...optionalParams: any[]) {
        safeConsole(console.log, colors.black, colors.green, ...this._format("info", message, optionalParams));
    }
    info(message: any, ...optionalParams: any[]) {
        if (this.logLevel >= levels.info) safeConsole(console.log, colors.black, colors.green, ...this._format("info", message, optionalParams));
    }

    error(message: any, ...optionalParams: any[]) {
        let e = message;
        if (typeof message === "string") {
            if (optionalParams[0] instanceof Error) {
                e = tame(optionalParams[0]);
                e.message = message;
            }
        } else if (message instanceof Error) {
            e = tame(message);
        }
        safeConsole(console.error, colors.black, colors.red, ...this._format("error", e, optionalParams));
    }

    warn(message: any, ...optionalParams: any[]) {
        if (this.logLevel >= levels.warn) safeConsole(console.warn, colors.black, colors.yellow, ...this._format("warn", message, optionalParams));
    }

    debug?(message: any, ...optionalParams: any[]) {
        if (this.logLevel >= levels.debug) safeConsole(console.debug, colors.black, colors.blue, ...this._format("debug", message, optionalParams));
    }

    verbose(message: any, ...optionalParams: any[]) {
        if (this.logLevel >= levels.verbose) safeConsole(console.log, colors.black, colors.magenta, ...this._format("verbose", message, optionalParams));
    }

    _format(level: string, message: any, ...args: any[]) {
        const prod = process.env["NODE_PROD"] === "production";
        const time = new Date().toISOString();
        return prod
            ? [{ level, time, message, args, scope: this.scope }]
            : [`[${level}]`, colors.black, colors.white, `[${time}]`, message, ...args, colors.black, colors.cyan, `[${this.scope}]`];
    }
}

export function loggerFactory(scope: string, level: levels = defaultLevel as levels): NestLogger {
    return new NestLogger(scope, level);
}

export const logger = loggerFactory(process.env["APP_NAME"] ?? "Nest");
export function updateDefaultLoggerScope(scope: string) {
    logger.scope = scope;
}

type FriendlyError = {
    name: string;
    message: string;
    stack: string[];
    meta?: Object;
    cause?: FriendlyError;
};
function tame(unfriendly: unknown): FriendlyError {
    switch (typeof unfriendly) {
        case "object": {
            const err = unfriendly as any;
            const friendly = {
                name: err.name ?? "Error",
                message: err.message ?? +err,
                stack: parseStack(err.stack),
                cause: "cause" in err ? tame(err.cause) : undefined,
            } as FriendlyError;
            friendly.meta = Object.keys(err)
                .filter((k) => !(k in friendly))
                .map((k) => ({ [k]: err[k] }));
            return friendly;
        }
        case "string":
            return {
                name: "Error",
                message: unfriendly,
                stack: parseStack(),
            };
        default:
            return {
                name: "Error",
                message: "",
                stack: parseStack(),
            };
    }
}

function parseStack(stack?: string, pops = stack ? 1 : 2) {
    //1 pops the message and 2 pops the message and the caller
    const s = stack ?? new Error().stack ?? "";
    return s
        .split("\n")
        .slice(pops)
        .map((line) => (line.startsWith("    ") ? line.substring(4) : line));
}
