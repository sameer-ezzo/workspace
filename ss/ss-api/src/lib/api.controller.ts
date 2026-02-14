import { Controller, HttpException, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { DataService, Patch } from "@ss/data";
import { AuthorizeService } from "@ss/rules";
import type { IncomingMessage, Rule } from "@noah-ark/common";
import { AppError, EndPoint, Message, toHttpException } from "@ss/common";
import ObjectToCSV from "object-to-csv";
import { _query } from "./_query";

const baseUrl = "/api";

export function provideApiRulesFromPaths(paths: string[]): Rule[] {
    const operations = ["Create", "Read", "Update", "Patch", "Delete", "Export"];
    const makeRule = (p: string): Rule => {
        return {
            path: p,
            name: p,
            builtIn: true,
            ruleSource: "code",
            actions: operations
                .map((operation) => {
                    return {
                        [operation]: [
                            {
                                access: "grant",
                                by: "role",
                                builtIn: true,
                                value: "super-admin",
                                name: operation,
                                action: operation,
                                rule: p,
                            },
                        ],
                    };
                })
                .reduce((a, b) => ({ ...a, ...b }), {}),
        } as Rule;
    };
    return paths.map((path) => makeRule(`/api/${path}`)) as Rule[];
}
@Controller("api")
export class ApiController {
    constructor(
        private authorizationService: AuthorizeService,
        private dataService: DataService,
    ) {}

    @EndPoint({ http: { method: "POST", path: "**" }, operation: "Create" })
    public async post(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl);
        const newData = msg.payload;
        const principle = msg.principle;

        try {
            const result = await this.dataService.post(path, newData, principle);
            return result;
        } catch (error) {
            throw toHttpException(error);
        }
    }

    @EndPoint({ http: { method: "GET", path: "**" }, operation: "Read" })
    public async agg(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl);

        const { total, data } = await this.dataService.agg(path, false, ...q);
        const result = { data, total, query: q };
        return result;
    }

    @EndPoint({ http: { method: "PUT", path: "**" }, operation: "Update" })
    public async put(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl);
        const doc = msg.payload;
        const principle = msg.principle;

        const segments = path.split("/").filter((s) => s);
        if (segments.length < 2) throw toHttpException(new AppError("Invalid document path", { code: "INVALID_DOCUMENT_PATH", status: HttpStatus.BAD_REQUEST }));

        segments.shift();
        segments.shift();
        const patches = [{ op: "replace", path: "/" + segments.join("/"), value: doc } as Patch];

        const oldData = await this.dataService.get(path);
        const { access, rule, source, action } = this.authorizationService.authorize(msg, "Update", { ...msg, oldData, patches });
        if (access === "deny")
            throw toHttpException(new AppError("Access denied", { code: "ACCESS_DENIED", status: HttpStatus.FORBIDDEN, details: { rule, source, action, q: msg.query } }));

        try {
            const result = await this.dataService.put(path, doc, principle);
            return result;
        } catch (error) {
            throw toHttpException(error);
        }
    }

    @EndPoint({ http: { method: "PATCH", path: "**" }, operation: "Patch" })
    public async patch(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl);
        const patches = <Patch[]>msg.payload; //req.body
        const principle = msg.principle; //(<any>req).user

        const segments = path.split("/").filter((s) => s);
        if (segments.length !== 2) {
            throw toHttpException(new AppError("Invalid document path", { code: "INVALID_DOCUMENT_PATH", status: HttpStatus.BAD_REQUEST }));
        }

        const oldData = await this.dataService.get(path);

        const { access, rule, source, action } = this.authorizationService.authorize(msg, "Update", { oldData, patches });
        if (access === "deny")
            throw toHttpException(new AppError("Access denied", { code: "ACCESS_DENIED", status: HttpStatus.FORBIDDEN, details: { rule, source, action, q: msg.query } }));

        try {
            const result = await this.dataService.patch(path, patches, principle);
            return result;
        } catch (error) {
            throw toHttpException(error);
        }
    }

    @EndPoint({ http: { method: "DELETE", path: "**" }, operation: "Delete" })
    public async delete(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl);
        const principle = msg.principle;

        const oldData = await this.dataService.get(path);

        const { access, rule, source, action } = this.authorizationService.authorize(msg, "Delete", { oldData });
        if (access === "deny")
            throw toHttpException(new AppError("Access denied", { code: "ACCESS_DENIED", status: HttpStatus.FORBIDDEN, details: { rule, source, action, q: msg.query } }));

        try {
            const result = await this.dataService.delete(path, principle);
            return result;
        } catch (error) {
            throw toHttpException(error);
        }
    }

    @EndPoint({ http: { method: "GET", path: "export/**" }, operation: "Export" })
    public async export(@Message() msg: IncomingMessage, @Res() res: Response) {
        const { path, q } = _query(msg.path, msg.query, "/export" + baseUrl);

        const { total, data } = await this.dataService.agg(path, true, ...q);
        if (total === 0) throw toHttpException(new AppError("Not found", { code: "NOT_FOUND", status: HttpStatus.NOT_FOUND }));

        const firstItem = data[0];
        const keys = Object.keys(firstItem).map((key) => {
            return { key, as: key };
        });
        const otc = new ObjectToCSV({ data, keys, shouldExpandObjects: true });
        const csv = otc.getCSV();

        if (res) {
            res.setHeader("Content-Type", "application/csv");
            res.setHeader("Content-Disposition", `attachment filename=${path.substring(1)}.csv`);
        }

        return Buffer.from(csv);
    }
}
