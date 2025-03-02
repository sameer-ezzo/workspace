import { Controller, HttpException, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { DataService, Patch } from "@ss/data";
import { AuthorizeService } from "@ss/rules";
import type { IncomingMessage, Rule } from "@noah-ark/common";
import { EndPoint, Message } from "@ss/common";
import ObjectToCSV from "object-to-csv";
import { logger } from "@ss/common";
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
            throw this._error(error);
        }
    }

    @EndPoint({ http: { method: "GET", path: "**" }, operation: "Read" })
    public async agg(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl);

        const data = await this.dataService.agg(path, false, ...q);
        const total = data.length ? await this.dataService.count(path, ...q) : 0; //TODO use count based on pipeline api
        const result = { data, total, query: q };
        return result;
    }

    @EndPoint({ http: { method: "PUT", path: "**" }, operation: "Update" })
    public async put(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl);
        const doc = msg.payload;
        const principle = msg.principle;

        const segments = path.split("/").filter((s) => s);
        if (segments.length < 2) throw new HttpException("InvalidDocumentPath", HttpStatus.BAD_REQUEST);

        segments.shift();
        segments.shift();
        const patches = [{ op: "replace", path: "/" + segments.join("/"), value: doc } as Patch];

        const oldData = await this.dataService.get(path);
        const { access, rule, source, action } = this.authorizationService.authorize(msg, "update", { ...msg, oldData, patches });
        if (access === "deny") throw new HttpException({ rule, source, action, q: msg.query }, HttpStatus.FORBIDDEN);

        try {
            const result = await this.dataService.put(path, doc, principle);
            return result;
        } catch (error) {
            throw this._error(error);
        }
    }

    @EndPoint({ http: { method: "PATCH", path: "**" }, operation: "Patch" })
    public async patch(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl);
        const patches = <Patch[]>msg.payload; //req.body
        const principle = msg.principle; //(<any>req).user

        const segments = path.split("/").filter((s) => s);
        if (segments.length != 2) {
            throw new HttpException("Invalid_Document_Path", HttpStatus.BAD_REQUEST);
        }

        const oldData = await this.dataService.get(path);

        const { access, rule, source, action } = this.authorizationService.authorize(msg, "update", { oldData, patches });
        if (access === "deny") throw new HttpException({ rule, source, action, q: msg.query }, HttpStatus.FORBIDDEN);

        try {
            const result = await this.dataService.patch(path, patches, principle);
            return result;
        } catch (error) {
            throw this._error(error);
        }
    }

    @EndPoint({ http: { method: "DELETE", path: "**" }, operation: "Delete" })
    public async delete(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl);
        const principle = msg.principle;

        const oldData = await this.dataService.get(path);

        const { access, rule, source, action } = this.authorizationService.authorize(msg, "delete", { oldData });
        if (access === "deny") throw new HttpException({ rule, source, action, q: msg.query }, HttpStatus.FORBIDDEN);

        try {
            const result = await this.dataService.delete(path, principle);
            return result;
        } catch (error) {
            throw this._error(error);
        }
    }

    @EndPoint({ http: { method: "GET", path: "export/**" }, operation: "Export" })
    public async export(@Message() msg: IncomingMessage, @Res() res: Response) {
        const { path, q } = _query(msg.path, msg.query, "/export" + baseUrl);

        const data: any[] = await this.dataService.agg(path, true, ...q);
        if (data.length === 0) throw new HttpException("NotFound", HttpStatus.NOT_FOUND);

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

    _error(error: any) {
        if (!error) return new HttpException({ code: "UNKNOWN-ERROR" }, HttpStatus.INTERNAL_SERVER_ERROR);
        if (error.code === 11000) {
            // duplicate key error
            const keys = Object.entries(error["keyPattern"])
                .filter(([, v]) => v === 1)
                .map(([k]) => k);
            return new HttpException({ code: "CONSTRAINT-VIOLATION", message: `Cannot create duplicate ${keys.join()}`, type: "UNIQUE", keys }, HttpStatus.CONFLICT);
        }

        if (error.code === 121) {
            // document validation error
            return new HttpException({ code: "VALIDATION-ERROR", message: error.errInfo }, HttpStatus.BAD_REQUEST);
        }

        if (error.code === 13) {
            return new HttpException({ code: "ACCESS-DENIED", message: "You do not have permission to perform this operation." }, HttpStatus.FORBIDDEN);
        }
        if (error.code === 26) {
            return new HttpException({ code: "RESOURCE-NOT-FOUND", message: "The specified collection or database does not exist." }, HttpStatus.NOT_FOUND);
        }
        if (error.code === 50) {
            return new HttpException({ code: "TIMEOUT", message: "The operation took too long to execute." }, HttpStatus.REQUEST_TIMEOUT);
        }

        if (error.code === 11600) {
            return new HttpException({ code: "INTERRUPTED", message: "The operation was interrupted. Please retry." }, HttpStatus.SERVICE_UNAVAILABLE);
        }
        if (error.code === 4) {
            return new HttpException({ code: "TOO-MANY-REQUESTS", message: "The operation failed due to rate limiting. Please retry later." }, HttpStatus.TOO_MANY_REQUESTS);
        }
        if (error.code === 112) {
            return new HttpException({ code: "WRITE-NOT-ALLOWED", message: "Writes are not allowed on this node or database." }, HttpStatus.FORBIDDEN);
        }
        if (error.code === 2) {
            return new HttpException({ code: "BAD-VALUE", message: "Invalid value or argument provided in the query." }, HttpStatus.BAD_REQUEST);
        }
        //TRANSACTION ERRORS
        if (error.code === 251) {
            return new HttpException({ code: "NO-SUCH-TRANSACTION", message: "The transaction does not exist or has expired." }, HttpStatus.BAD_REQUEST);
        }
        if (error.code === 244) {
            return new HttpException({ code: "TRANSIENT-TRANSACTION-ERROR", message: "A transient error occurred during the transaction. Please retry." }, HttpStatus.CONFLICT);
        }
        if (error.code === 225) {
            return new HttpException({ code: "TRANSACTION-TIMEOUT", message: "The transaction exceeded its lifetime limit." }, HttpStatus.REQUEST_TIMEOUT);
        }
        if (error.code === 225) {
            return new HttpException({ code: "TRANSACTION-TIMEOUT", message: "The transaction exceeded its lifetime limit." }, HttpStatus.REQUEST_TIMEOUT);
        }

        if (error.code === 8000) {
            return new HttpException({ code: "WRITE-CONFLICT", message: "A write conflict occurred. Please retry the operation." }, HttpStatus.CONFLICT);
        }
        if (error.code === 11600) {
            return new HttpException({ code: "INTERRUPTED-OPERATION", message: "The operation was interrupted. Please retry." }, HttpStatus.SERVICE_UNAVAILABLE);
        }

        if (error.code === 67) {
            return new HttpException({ code: "INDEX-CREATION-ERROR", message: "Failed to create index. Check your index options and fields." }, HttpStatus.BAD_REQUEST);
        }
        if (error.code === 85) {
            return new HttpException({ code: "INDEX-OPTIONS-CONFLICT", message: "Conflicting index options detected. Check your index definitions." }, HttpStatus.CONFLICT);
        }
        if (error.code === 173) {
            return new HttpException({ code: "TEXT-SEARCH-NOT-ENABLED", message: "Text search is not enabled on the specified field or collection." }, HttpStatus.BAD_REQUEST);
        }

        //SHARDING ERRORS
        if (error.code === 63) {
            return new HttpException({ code: "STALE-SHARD-VERSION", message: "Shard version is stale. Retrying the operation may resolve this." }, HttpStatus.CONFLICT);
        }
        if (error.code === 150) {
            return new HttpException(
                { code: "SHARD-KEY-NOT-FOUND", message: "The shard key is missing in the operation. Ensure the shard key is included." },
                HttpStatus.BAD_REQUEST,
            );
        }
        if (error.code === 72) {
            return new HttpException({ code: "INVALID-OPTIONS", message: "Invalid options were provided in the command." }, HttpStatus.BAD_REQUEST);
        }

        const message = error.message || error;
        const stack = error.stack || "";
        logger.error(message, stack);
        return new HttpException({ message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
