import { INestApplicationContext, NestMiddleware, Type } from "@nestjs/common";
import { ExpressAdapter, NestExpressApplication } from "@nestjs/platform-express";
import { MicroserviceOptions } from "@nestjs/microservices";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Server, ServerOptions } from "socket.io";
import { RedisIoAdapter } from "./ws/socket.redis.adapter";
import { RedisClient } from "./redis";
import { registerListeners } from "./messaging/register-listeners.fun";
import { Deferred } from "@noah-ark/common";

import * as _cluster from "cluster";
import * as express from "express";
import { join } from "path";
import * as fs from "fs";
import { create } from "express-handlebars";

import * as os from "os";
import { logger, updateDefaultLoggerScope } from "./utils/logger";
import { completeEndpointsInfo } from "./messaging/endpoints-info.fun";
import { ConfigOptions } from "express-handlebars/types";
import { env } from "process";
import { NestFactoryStatic } from "@nestjs/core/nest-factory";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import cookieParser from "cookie-parser";

export let appName: string;
export let application: NestExpressApplication;

export type AppOptions = {
    microservices: MicroserviceOptions[];
    noOfClusters: number;
    socketAdapter?: "default" | `REDIS_${string}` | ((app: INestApplicationContext) => IoAdapter);
    applicationName?: string;
    staticAssets?: { [path: string]: string };
    websocketServer?: Partial<ServerOptions>;
    handlebarsConfig?: Partial<ConfigOptions>;
    middlewares?: NestMiddleware[];
    cors?: {
        enabled: boolean; // Indicates if CORS should be enabled
        options?: CorsOptions; // Optional configuration when CORS is enabled
    };

    useCookies?: {
        secret: string | string[]; // Secret for signing cookies
        options?: cookieParser.CookieParseOptions;
    };
};

const defaultSocketServerOptions: Partial<ServerOptions> = {
    pingTimeout: 300,
    allowEIO3: true,
    connectTimeout: 5000,
};

export const defaultAppOptions: AppOptions = {
    microservices: [],
    noOfClusters: 1,
    socketAdapter: "default",
    websocketServer: defaultSocketServerOptions,
};

const sizeLimit = "10mb";
const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
function dateReviver(key: string, value: unknown) {
    return typeof value === "string" && dateFormat.test(value) ? new Date(value) : value;
}

const jsonParse = JSON.parse;
JSON.parse = (text: string, reviver?: any) => {
    return jsonParse(text, reviver ?? dateReviver);
};

const defaultAppBootRequirementsCheck = async () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone !== "UTC") console.error(`Timezone must be set to UTC, current timezone is: ${timezone}, Please set the timezone to UTC`);
};

// BOOT APP/MICROSERVICE AND FORK WORKERS
export async function bootstrap(
    module: Type<unknown>,
    port = 3333,
    options?: Partial<AppOptions>,
    appBootRequirementsCheck: (...args: any[]) => Promise<void> = defaultAppBootRequirementsCheck,
) {
    if (appBootRequirementsCheck) await appBootRequirementsCheck();
    const applicationName = options?.applicationName ?? process.env["APP_NAME"] ?? module.name;
    updateDefaultLoggerScope(applicationName);
    const cluster = _cluster.default;
    let noOfClusters = Math.abs(options?.noOfClusters ?? 1);
    if (noOfClusters > 1 && cluster.isPrimary) {
        const numCPUs = os.cpus().length;
        noOfClusters = Math.min(noOfClusters, numCPUs);

        //socket io
        // setupMaster(httpServer, {
        //     loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
        // })
        for (let i = 0; i < noOfClusters; i++) cluster.fork();

        logger.info(`Starting master ${applicationName}`);

        cluster.on("exit", (worker, code, signal) => {
            if (code !== 0) logger.error(`Worker ${worker.process.pid} died, code: ${code}, signal: ${signal}`);
            else logger.warn(`Worker ${worker.process.pid} died, code: ${code}, signal: ${signal}`);

            cluster.fork();
        });

        return cluster;
    } else {
        logger.info(`Starting application ${applicationName}`);
        const app = await _bootstrap(applicationName, module, port, options);
        logger.info(`application ${applicationName} started`);
        return app;
    }
}

// BOOT EXPRESS APP USING NEST FACTORY
async function _bootstrap(applicationName: string, module: Type<unknown>, port = 3333, _options?: Partial<AppOptions>) {
    const options: AppOptions = { ...defaultAppOptions, ..._options };

    //LOGGING AND HANDLING ERRORS
    process.on("uncaughtException", (err: Error) => _unhandledError(err));
    process.on("unhandledRejection", (err: Error) => _unhandledError(err));

    //INITIATE ROOT LEVEL DEPENDENCIES
    const httpAdapter = new ExpressAdapter();
    const ioServerDeferredInitialization = new Deferred();
    httpAdapter.set("io-server", ioServerDeferredInitialization);

    appName = applicationName;
    completeEndpointsInfo();
    //INITIATE APP (AND DEPENDENCIES)
    application = await new NestFactoryStatic().create<NestExpressApplication>(module, httpAdapter, { logger, autoFlushLogs: true, bufferLogs: true });
    // application.useLogger(logger)

    const staticAssets = options.staticAssets ?? { assets: "assets" };
    for (const p in staticAssets) {
        const assets_dir = staticAssets[p].startsWith("/") ? staticAssets[p] : join(__dirname, staticAssets[p]);
        if (fs.existsSync(assets_dir)) {
            application.use(p, express.static(assets_dir));
            logger.warn(`Static assets served from ${assets_dir}`);
        }
    }

    application.use(express.json({ reviver: dateReviver, strict: false, limit: sizeLimit })); // To parse the incoming requests with JSON payloads (reviver automatically convert date string to date obj)
    application.use(express.text({ limit: sizeLimit })); // To parse the incoming requests with JSON payloads
    application.use(
        express.urlencoded({
            extended: true,
            limit: sizeLimit,
            parameterLimit: 1000,
        }),
    );

    if (options.middlewares) for (const mw of options.middlewares) application.use(mw);

    //START SOCKET ADAPTER
    if (options.websocketServer) {
        if (typeof options.socketAdapter === "string" && options.socketAdapter.startsWith("REDIS_")) {
            const redisClient = (await application.get(options.socketAdapter)) as RedisClient;
            application.useWebSocketAdapter(new RedisIoAdapter(application, redisClient));
        } else if (typeof options.socketAdapter === "function") application.useWebSocketAdapter(options.socketAdapter(application));
        else application.useWebSocketAdapter(new IoAdapter(application));
    }

    const cors = options.cors ?? { enabled: env["NODE_ENV"] === "development", options: { origin: "*" } };
    if (cors.enabled) application.enableCors(cors.options);
    
    if (options["useCookies"]) {
        application.use(cookieParser(options["useCookies"].secret, options["useCookies"].options));
    }
    application.useGlobalInterceptors();

    //START MICROSERVICES
    if (options.microservices?.length) {
        options.microservices.forEach((m) => {
            application.connectMicroservice(m, { inheritAppConfig: true });
            logger.info(`Microservice listening info:${m}`);
        });
        await application.startAllMicroservices();
    }

    try {
        await registerListeners(application);
    } catch (error) {
        console.log("APPLICATION COULD NOT BE INITIALIZED");
    }

    //VIEW ENGINE
    application.setBaseViewsDir(join(__dirname, "views"));
    const hbs = create({
        defaultLayout: "main",
        layoutsDir: options.handlebarsConfig?.layoutsDir || join(__dirname, "views"),
        helpers: options.handlebarsConfig?.helpers,
    });
    if (options.handlebarsConfig?.helpers) {
        const hbsHelpers = hbs.handlebars["helpers"] as any;
        hbs.handlebars["helpers"] = {
            ...hbsHelpers,
            ...options.handlebarsConfig?.helpers,
        };
        application.engine("handlebars", hbs.engine);
    }

    if (options.websocketServer) {
        const socketServer = new Server(httpAdapter.getHttpServer(), {
            ...defaultSocketServerOptions,
            ...options.websocketServer,
        });

        const connection_error_codes = {
            0: "Transport unknown",
            1: "Session ID unknown",
            2: "Bad handshake method",
            3: "Bad request",
            4: "Forbidden",
            5: "Unsupported protocol version",
        } as Record<number, string>;

        socketServer.engine.on("connection_error", (err) => {
            console.log("connection_error");
            //console.log(err.req);      // the request object
            console.log("code", connection_error_codes[err.code]); // the error code, for example 1
            console.log(err.message); // the error message, for example "Session ID unknown"
            console.log(err.context); // some additional error context
        });

        socketServer.on("connection", (socket) => {
            console.log(`New client connected: ${socket.id}`);
            socket.on("disconnect", () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
        ioServerDeferredInitialization.resolve(socketServer);
    }

    await application.listen(port, () => logger.info(`Listening at ${port}`));

    return application;
}

function _unhandledError(err: Error) {
    logger.error("Uncaught Error", err);
}
