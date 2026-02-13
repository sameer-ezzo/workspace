import { ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import type { IncomingMessage } from "@noah-ark/common";
import { EndpointsInfo } from "./endpoints-info.fun";

export function ExtractIncomingMessage(ctx: ExecutionContext): IncomingMessage {
    const transport = ctx.getType();
    switch (transport) {
        case "http": {
            const req = ctx.switchToHttp().getRequest() as Request & Record<string, any>;
            const res = ctx.switchToHttp().getResponse();
            const principle = req["principle"] ?? req["user"];

            //fill query object
            const query = Object.assign({}, req.query) as Record<string, string | string[]>;
            const params = Object.assign({}, req.params) as Record<string, string | string[]>;
            Object.keys(req.params)
                .filter((p) => !Number.isFinite(+p))
                .forEach((k) => {
                    params[k] = req.params[k];
                    query[k] = req.params[k]; // is this correct?!
                });

            const route = req.route.path;
            return {
                path: (req.path.startsWith("/") ? req.path : `/${req.path}`) as string,
                principle,
                params,
                query,
                payload: req.body,
                operation: EndpointsInfo._httpCache[`${req.method}:${route}`],
                res,
                req,
                ctx: {
                    ...req["_context"],
                    route,
                    ip: req.headers["x-forwarded-for"] ?? req.connection.remoteAddress,
                    headers: req.headers,
                    transport: "http",
                    method: req.method,
                },
            };
        }
        case "rpc": {
            const rpc = ctx.switchToRpc();
            const path = rpc.getContext().args?.[0]; //message pattern name

            const payload = rpc.getData();

            const operation = EndpointsInfo._commandsCache[path] ?? EndpointsInfo._eventsCache[path]; //TODO test if this is correct
            EndpointsInfo.events.find((x) => x.event === path)?.operation;
            return { payload, path, operation, ctx: { transport: "rpc" } };
        }

        case "ws": {
            const payload = ctx.switchToWs().getData();
            const client = ctx.switchToWs().getClient();
            const path = payload.path?.length ? payload.path : "/";
            const operation = EndpointsInfo._wsCache[path]; //TODO test if this is correct
            return {
                payload,
                path,
                principle: payload?.principle,
                operation,
                ctx: { transport: "ws", client },
            };
        }
        default: {
            const n: never = transport;
            throw new Error("UNSUPPORTED_TRANSPORT");
        }
    }
}
