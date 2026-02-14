import { Controller, HttpException, HttpStatus } from "@nestjs/common";
import type { IncomingMessage, Principle, SimplePermission } from "@noah-ark/common";
import { AppError, EndPoint, EndpointsInfo, Message, logger, toHttpException } from "@ss/common";
import { DataService } from "@ss/data";
import { join } from "path";
import { RulesService } from "./rules.svr";
import { RulesImporterService } from "./rules-importer.svr";
import { Authorize } from "./authorize.decorator";

@Controller("permissions")
export class PermissionController {
    constructor(
        private rulesService: RulesService,
        private rulesImporter: RulesImporterService,
        private readonly data: DataService,
    ) {}

    @EndPoint({ http: { method: "POST", path: "getRule" } })
    getRule(@Message() msg: IncomingMessage<any>) {
        return this.rulesService.getRule(msg.payload.path);
    }

    @EndPoint({ http: { method: "GET", path: "rules" } })
    @Authorize({ by: "anonymous" })
    getRules() {
        return this.rulesService.rulesManager.tree;
    }

    @EndPoint({ http: { method: "GET", path: "*" } })
    async getPermissions() {
        return await this.data.get("permission");
    }

    @EndPoint({ http: { method: "POST", path: "restore-permissions" } })
    async restorePermissions(@Message() msg: IncomingMessage<any>) {
        const permissionsTree = msg.payload;
        await this.rulesImporter.restore(permissionsTree, msg.principle);
        await this.rulesService.initializeRulesManager();

        return this.rulesService.rulesManager.tree;
    }

    @EndPoint({ http: { method: "GET", path: "user-permissions/:id" } })
    async getPermissionsForUser(@Message() msg: IncomingMessage<any>) {
        const userId = msg.query.id as string;
        const principle = msg.principle as Principle;
        if (!principle && !userId) return [];
        const user = userId && userId !== principle.sub ? await this.data.find("user", userId) : principle;
        if (!user) throw toHttpException(new AppError("User not found", { code: "USER_NOT_FOUND", status: HttpStatus.NOT_FOUND }));
        return [];
    }

    //nest steps
    // define collections (schema)
    // then based on the collections add rules/actions

    // permission over a property? => query???  {user=$principle.sub} based on user || {state=$data.state} based on existing data        ... so the context could contain what ever
    // => default values ...? hmm as long as the query is setting a value based on expression it's easy to use it as a default value !!
    // what?? when?? rule.query is going to be checked?
    // rule loading strategy is:
    // 1- at the client-app subscribe to if auth.user$ and try to load rules from local storage if none then load from server (with expiry to local session)
    // 2- whenever 403 permission denied page was shown reload rules from the server

    //{ authorize: { path: '/asset?query', action: ['create'] } }
    //inside the view it may ask for more details about the permission
    @EndPoint({
        http: { method: "POST", path: "updatePermission" },
        cmd: "permissions/update",
    })
    public async updatePermission(
        @Message()
        msg: IncomingMessage<SimplePermission & { rule: string; action: string }>,
    ) {
        try {
            const { rule, action } = msg.payload!;
            return await this.rulesService.updatePermission(rule, action, msg.payload!, msg.principle!);
        } catch (error) {
            logger.error(error);
            throw toHttpException(error);
        }
    }

    @EndPoint({
        http: { method: "DELETE", path: "deletePermission/:id" },
        cmd: "permissions/delete",
    })
    public async deletePermission(@Message() msg: IncomingMessage<any>) {
        const id = msg.query!.id as string;
        if (!id) throw toHttpException(new AppError("Id is required", { code: "ID_REQUIRED", status: HttpStatus.NOT_FOUND }));
        return await this.rulesService.deletePermission(id, msg.principle!);
    }

    @EndPoint({
        http: { method: "POST", path: "actions" },
        cmd: "permissions/actions",
    })
    public async getActionsForPath(@Message() msg: IncomingMessage<{ path: string }>) {
        const payload = msg.payload!;
        const path = payload.path.startsWith("/") ? payload.path.substring(1) : payload.path;
        const records = EndpointsInfo.httpEndpoints.filter((x) => path.startsWith(x.prefix) || join(x.prefix, x.path) === x.path);

        return [...new Set(records.map((x) => x.operation ?? x.path))];
    }

    //+CRUD for permission
}

// how the client can know what is accessible from the beginning to hide UI elements for inaccessible links????
//TODO https://betterprogramming.pub/docker-for-node-js-in-production-b9dc0e9e48e0
//TODO https://towardsdatascience.com/how-to-deploy-a-mongodb-replica-set-using-docker-6d0b9ac00e49
