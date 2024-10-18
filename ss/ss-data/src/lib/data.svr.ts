import mongoose, { Connection, ConnectOptions } from "mongoose";
import { Model, Document } from "mongoose";

import mongooseUniqueValidator from "mongoose-unique-validator";
import { PathInfo } from "@noah-ark/path-matcher";
import { HttpException, HttpStatus, Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { JsonPointer } from "@noah-ark/json-patch";

import { Patch } from "./model";
import { DbConnectionOptions } from "./data-options";
import { Broker } from "@ss/common";
import { logger } from "./logger";

//const mongooseHidden = require('mongoose-hidden')();  this plugin forces schema

export type DocumentIdType = string | number | mongoose.Types.ObjectId;

export type WriteResult<T> = {
    errors?: any[];
    _id: any;
    document?: T;
};

import toMongodb from "jsonpatch-to-mongodb";
import { QueryParser } from "./api.query";
import { DataChangedEvent } from "./data-changed-event";
import { ObjectId } from "mongodb";
import { MigrationsService } from "./migrations.svr";

export const defaultMongoDbConnectionOptions: ConnectOptions = {
    autoIndex: true,
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    connectTimeoutMS: 5000,
    family: 4, // Use IPv4, skip trying IPv6
};

mongoose.pluralize(undefined);
@Injectable()
export class DataService implements OnModuleInit, OnApplicationShutdown {
    queryParser: QueryParser;
    protected prefix = "";
    constructor(
        public readonly name: string,
        public readonly connection: Connection,
        public readonly options: DbConnectionOptions,
        protected readonly broker: Broker,
    ) {
        this.queryParser = new QueryParser();
        this.prefix = this.options.prefix ?? process.env.DBPREFIX ?? "";
    }

    async getModel<T extends Document = any>(name: string, prefix?: string): Promise<Model<T> | undefined> {
        prefix ??= this.prefix;
        let model = this.connection.models[name];
        if (!model && this.options.autoCreateModel) {
            const schema = await this.getDynamicSchema(name);
            model = await this.addModel(name, schema);
        }

        return model;
    }

    async addModel(collection: string, schema: mongoose.Schema, prefix?: string, exclude: string[] = [], overwrite = false): Promise<Model<any>> {
        prefix ??= this.prefix;
        const prefixedCollection = prefix + collection;

        let model = this.connection.models[collection];
        if (model && !overwrite) return model;

        logger.info(`Adding schema: [${collection}] overwrite:${overwrite}`);
        const existingCollection = model ? await model.findOne({}) : null;
        if (existingCollection && existingCollection._id) {
            let schemaIdType = "String";
            const typeOfId = typeof existingCollection._id;
            switch (typeOfId) {
                case "string":
                    schemaIdType = "String";
                    break;
                case "number":
                    schemaIdType = "Number";
                    break;
                case "object":
                    schemaIdType = "ObjectId";
                    break;
            }

            if (schemaIdType !== schema.paths._id.instance) {
                logger.error(
                    `Schema: [${collection}] has different _id type. The existing id ${existingCollection._id} of type ${typeOfId} is different from the schema id type ${schema.paths._id.instance}!`,
                );
                return null;
            }
        }

        if (!model || (model && !overwrite)) {
            try {
                schema.plugin(mongooseUniqueValidator);
                model = this.connection.model(collection, schema, prefixedCollection, {
                    overwriteModels: overwrite,
                });
            } catch (error) {
                logger.error(`Error on getting model: ${collection}`, error);
            }
        }

        // if (exclude?.length > 0) this.addExclusion(collection, exclude);
        logger.info(`Schema: [${collection}] has been added successfully!`);

        // run migrations for this collection
        // const migration = (this.migrations || []).filter(
        //   (m) => m.collectionName === collection,
        // );
        // await this._migrate(this, migration);

        return model;
    }

    getDynamicSchema(collection: string): Promise<mongoose.Schema>;
    getDynamicSchema(collection: string, idType: "string" | "ObjectId"): Promise<mongoose.Schema>;
    getDynamicSchema(collection: string, idType: mongoose.SchemaDefinitionProperty): Promise<mongoose.Schema>;
    async getDynamicSchema(collection: string, idType?: unknown): Promise<mongoose.Schema> {
        idType = idType ?? String;

        const schema = new mongoose.Schema({}, { strict: false });

        let _idType: mongoose.SchemaDefinitionProperty;

        const model = await this.getModel(collection);
        const existingCollection = model ? await model.findOne({}) : null;
        if (existingCollection && existingCollection._id) {
            const typeOfId = typeof existingCollection._id;
            if (typeOfId === "string") _idType = String;
            else if (typeOfId === "number") _idType = Number;
            else if (typeOfId === "object") _idType = mongoose.SchemaTypes.ObjectId;
        }

        if (!_idType) {
            if (idType === "ObjectId") _idType = mongoose.SchemaTypes.ObjectId;
            else if (idType === "string") _idType = String;
            else _idType = idType;
        }

        schema.add({ _id: _idType });
        return schema;
    }

    async find<T>(modelName: string, id?: DocumentIdType, pointer?: string, projection?: any, query?: any, sort?: any, page = 1, per_page = 100): Promise<T | undefined> {
        if (!query) query = {};
        if (!sort) sort = {};
        if (!projection) projection = {};

        if (id) {
            query["_id"] = id;
        }

        // const exclude = this.getExclusions(modelName) || [];
        // if (exclude.length) {
        //   const includes = Object.keys(projection);
        //   if (includes.length) exclude.forEach((x) => delete projection[x]); //remove included fields that are supposed to be excluded
        //   if (Object.keys(projection).length === 0)
        //     exclude.forEach((x) => (projection[x] = 0)); //make sure to exclude in nothing included
        // }

        let model = await this.getModel(modelName);

        if (id) {
            if (!model) return undefined as T;
            const result = await model.findById(id, projection).lean();
            // const result = (await model.findOne({ _id:  }).lean()) as T
            if (!result) return undefined as T;

            try {
                return (pointer ? JsonPointer.get(result, `/${pointer}`) : result) as T;
            } catch (error) {
                return null;
            }
        } else {
            if (!model) return [] as T;
            const result = await model
                .find(query, projection)
                .limit(per_page)
                .skip((page - 1) * per_page)
                .sort(sort)
                .lean();
            return (result ?? []) as T;
        }
    }



    async get<T = any>(path: string | PathInfo, ...q: { [key: string]: string }[]): Promise<T> {
        let segments;
        try {
            segments = typeof path === "string" ? PathInfo.parse(path) : path;
        } catch (error) {
            throw { status: 400, body: "INVALID_PATH" };
        }

        let projection: any = {};
        if (segments.projectionPath) {
            projection[segments.projectionPath] = 1;
        }

        const model = await this.getModel(segments.collection);
        const queryInfo = q ? this.queryParser.parse(<any>q, model) : null;
        const filter: any = queryInfo ? queryInfo.filter : {};
        const sort = queryInfo ? queryInfo.sort : {};
        const page = queryInfo ? +queryInfo.page : 1;
        const per_page = queryInfo ? queryInfo.per_page : 100;
        const select = queryInfo ? queryInfo.select : {};
        projection = { ...select, ...projection };

        return this.find<T | T[]>(segments.collection, segments.id, segments.pointer, projection, filter, sort, page, per_page) as Promise<T>;
    }

    async count(path: string, ...q: { [key: string]: string }[]): Promise<number> {
        const result = await this.func(path, "count", ...q);
        return result || 0;
    }

    async func(path: string, f: "count", ...q: { [key: string]: string }[]) {
        let pathInfo;
        try {
            pathInfo = PathInfo.parse(path);
        } catch (error) {
            throw { status: 400, body: "INVALID_PATH" };
        }

        const model = await this.getModel(pathInfo.collection);
        const queryInfo = q.length ? this.queryParser.parse(q) : null;
        const query: any = queryInfo ? queryInfo.filter : {};

        if (pathInfo.id) query["_id"] = this.convertToModelId(pathInfo.id, "_id", model, `func(${f}) ${path} ${q}`);

        switch (f) {
            case "count":
                return model ? model.countDocuments(query) : 0;
            default:
                return Promise.resolve(null);
        }
    }

    async agg<T>(path: string, million = false, ...q: { [key: string]: string }[]): Promise<T[]> {
        const Q: any = q;
        if (Q != null && !Array.isArray(Q))
            q = Object.keys(Q).map((key) => {
                return { key, value: Q[key] };
            }); //convert to array if passed as object

        let pathInfo;
        try {
            pathInfo = PathInfo.parse(path);
        } catch (error) {
            throw { status: 400, body: "INVALID_PATH" };
        }

        const model = await this.getModel(pathInfo.collection);
        if (!model) return Promise.resolve([]);
        const query = q ? this.queryParser.parse(<any>q, model) : ({} as any);
        const pipeline = [];
        let _id = undefined;
        if (pathInfo.id) {
            _id = this.convertToModelId(pathInfo.id, "_id", model, `agg ${path} ${q}`);
            pipeline.push({ $match: { _id } });
            if (query.select) pipeline.push({ $project: query.select });
        } else {
            const page = query.page || 1;
            const max_page_number = 100;
            const per_page = million ? 1000000 : Math.min(query.per_page || max_page_number, max_page_number);

            if (query.fields1) pipeline.push({ $addFields: query.fields1 });
            if (query.fields2) pipeline.push({ $addFields: query.fields2 });
            if (query.fields3) pipeline.push({ $addFields: query.fields3 });
            if (query.lookups)
                query.lookups.forEach((l: any) => {
                    l.from = this.prefix + l.from;
                    const unwind = l.unwind;
                    delete l.unwind;
                    pipeline.push({ $lookup: l });
                    if (unwind) pipeline.push({ $unwind: "$" + l.as });
                });
            if (query.lookupsMatch) {
                query.lookupsMatch.forEach((l: any) => {
                    pipeline.push({
                        $lookup: {
                            from: this.prefix + l.from,
                            let: { l: "$" + l.localField },
                            pipeline: [
                                {
                                    $addFields: {
                                        joined: {
                                            $in: ["$" + l.foreignField, "$$l"],
                                        },
                                    },
                                },
                                {
                                    $match: {
                                        $and: [{ joined: true }, ...l.match],
                                    },
                                },
                                { $project: { joined: 0 } },
                            ],
                            as: l.as,
                        },
                    });
                });
            }
            if (query.filter && query.filter.$and && query.filter.$and.length) pipeline.push({ $match: query.filter });
            if (query.sort) pipeline.push({ $sort: query.sort });
            if (query.select) pipeline.push({ $project: query.select });

            const setLimitsBeforeGrouping = query.group === null || query.group?.items !== null; //limit before if document is included

            if (setLimitsBeforeGrouping) {
                pipeline.push({ $skip: (page - 1) * per_page });
                pipeline.push({ $limit: per_page });
            }

            if (query.group) pipeline.push({ $group: query.group });

            if (!setLimitsBeforeGrouping) {
                pipeline.push({ $skip: (page - 1) * per_page });
                pipeline.push({ $limit: per_page });
            }
        }
        const result = await model.aggregate(pipeline);
        return <T[]>result;
    }

    public async post<T = any>(path: string | PathInfo, newData: any, user?: any): Promise<{ _id: ObjectId; result: WriteResult<T> }> {
        let segments: PathInfo;
        try {
            segments = typeof path === "string" ? PathInfo.parse(path) : path;
        } catch (error) {
            throw { status: 400, body: "INVALID_PATH" };
        }

        const model = await this.getModel(segments.collection);
        if (segments.id) {
            //push to array field
            //if (!Array.isArray(oldData)) { throw { status: 400, body: "INVALID_POST" }; }
            const update = { $push: {} };
            if (segments.projectionPath) update.$push[segments.projectionPath] = newData;
            else update.$push = newData;

            const document = await model.findById(segments.id);
            if (!document) throw new HttpException("Not found", HttpStatus.NOT_FOUND);

            const result: any = await model.findByIdAndUpdate(segments.id, update, {
                new: true,
                upsert: true,
                lean: true,
            });
            this.broker.emit<DataChangedEvent<T>>(`data-changed/${segments.path}`, {
                path: segments.path,
                data: result.value,
                patches: [
                    {
                        op: "add",
                        path: <string>segments.pointer,
                        value: newData,
                    },
                ],
                user,
            });
            return { _id: newData._id, result: result };
        } else {
            if (!newData._id) newData._id = await this.generateId();
            else {
                const old = await model.countDocuments({ _id: newData._id });
                if (old) throw new HttpException("CANNOT_POST_OVER_EXISTING_DOCUMENT", HttpStatus.NOT_ACCEPTABLE);
            }

            const result: any = await model.findByIdAndUpdate(newData._id, newData, {
                new: true,
                upsert: true,
                lean: true,
            });
            this.broker.emit(`data-changed/${segments.path}/${newData._id}`, {
                path: `${segments.path}/${newData._id}`,
                data: result.value,
                patches: [{ op: "add", path: "/", value: result }],
                user,
            });
            return { _id: newData._id, result };
        }
    }

    private generatePatches(value: any, currentPath: string = ""): Patch[] {
        let patches: Patch[] = [];

        if (typeof value !== "object" || value === null) {
            // Base case: if the value is a primitive (or null), create a patch directly
            patches.push({ op: "replace", path: currentPath, value });
        } else if (Array.isArray(value)) {
            // Handle arrays
            value.forEach((item, index) => {
                patches = patches.concat(this.generatePatches(item, `${currentPath}/${index}`));
            });
        } else {
            // Handle objects
            for (const key in value) {
                if (value.hasOwnProperty(key)) {
                    patches = patches.concat(this.generatePatches(value[key], `${currentPath}/${key}`));
                }
            }
        }

        return patches;
    }

    async patch<T = any>(
        path: string,
        patches: Patch[],
        user: any,
        updateOptions: Partial<mongoose.QueryOptions<any>> = {
            new: true,
            upsert: false,
            lean: false,
        },
    ): Promise<WriteResult<T>> {
        const segments = path.split("/").filter((s) => s);
        if (segments.length !== 2) {
            throw { status: 400, body: "INVALID_PATH_FOR_PATCH" };
        }

        const collection = <string>segments.shift();
        const id = <string>segments.shift();
        const model = await this.getModel(collection);

        const directPatches = patches.filter((p) => p.path === "/");

        let result;

        const _directPatches = [] as Patch[];
        if (directPatches.length) {
            const directPatch = directPatches[directPatches.length - 1];
            const lastDirectPatchIndex = patches.indexOf(directPatch);
            patches = patches.filter((p, i) => i > lastDirectPatchIndex);
            const updatePatches = this.generatePatches(directPatch.value, "");
            _directPatches.push(...updatePatches);
        }

        patches.push(..._directPatches);

        if (patches.length) {
            patches = patches.map((p) => ({
                op: p.op,
                path: p.path,
                value: this.queryParser.autoParseValue(
                    p.value,
                    p.path
                        .split("/")
                        .filter((x) => x)
                        .join("."),
                    model,
                ),
            }));

            const update = toMongodb(patches);
            result = await model.findOneAndUpdate({ _id: id }, update, {
                ...updateOptions,
            });
        }

        if (result)
            this.broker.emit(`data-changed/${collection}/${id}`, {
                path: `/${collection}/${id}`,
                data: result,
                patches,
                user,
            });

        return result;
    }

    toPatches<T = any>(path: string, value: any): { path: string; patches: Patch[] } {
        const segments = path.split("/").filter((s) => s);
        if (segments.length < 2) throw { status: 400, body: "INVALID_DOCUMENT_PATH" };

        const collection = <string>segments.shift();
        const id = <string>segments.shift();
        const patches = [
            {
                op: "replace",
                path: "/" + segments.join("/"),
                value: value,
            } as Patch,
        ];

        return { path: `/${collection}/${id}`, patches };
    }

    async put<T = any>(path: string, value: any, user: any): Promise<WriteResult<T>> {
        const { path: _path, patches } = this.toPatches(path, value);
        return this.patch<T>(_path, patches, user);
    }

    async delete<T = any>(path: string, user: any): Promise<WriteResult<T>> {
        let segments;
        try {
            segments = PathInfo.parse(path);
        } catch (error) {
            throw { status: 400, body: "INVALID_PATH" };
        }

        const model = await this.getModel(segments.collection);
        if (!model) throw { status: 400, body: "INVALID_PATH" };

        if (segments.id) {
            if (segments.projectionPath) {
                const update: any = { $unset: {} };
                update.$unset[segments.projectionPath] = "";
                const result = await model.findByIdAndUpdate(segments.id, update, {
                    new: true,
                });
                this.broker.emit(`data-changed/${path}`, {
                    path,
                    data: result,
                    patches: [{ op: "remove", path: <string>segments.pointer }],
                    user,
                });
                return { _id: segments.id, ...result } as WriteResult<T>;
            } else {
                const result = await model.findByIdAndDelete(segments.id);
                this.broker.emit(`data-changed/${path}`, {
                    path,
                    data: result,
                    patches: [{ op: "remove", path: "/" }],
                    user,
                });
                return { _id: segments.id, ...result } as WriteResult<T>;
            }
        } else throw { status: 400, body: "INVALID_PATH" };
    }

    async inflate<T extends { _id: any }>(
        collection: string,
        deflatedItems: Partial<T>[],
        requiredFields: (keyof T)[],
        optionalFields: (keyof T)[] = [],
        inflateBy: (keyof T)[] = ["_id"],
    ): Promise<{ inflated: T[]; notInflated: T[] }> {
        const result: { inflated: T[]; notInflated: T[] } = {
            inflated: [],
            notInflated: [],
        };
        const toBeInflated: { [by in keyof T]?: any[] } = {};
        const fields = [...new Set([...requiredFields, ...optionalFields])];

        for (const deflated of deflatedItems) {
            if (fields.every((f) => f in deflated)) result.inflated.push(deflated as T);
            else {
                for (const by of inflateBy) {
                    if (deflated[by]) {
                        toBeInflated[by] ??= [];
                        toBeInflated[by].push(deflated[by]);
                        break;
                    }
                }
            }
        }

        const select = fields.join(",");
        for (const by of inflateBy) {
            if (!toBeInflated[by]) continue;
            const inflatedItems = await this.agg<T>(`/${collection}`, true, {
                select,
                [by]: `{in}${toBeInflated[by].join(",")}`,
            });
            if (inflatedItems.length !== toBeInflated[by].length) {
                logger.error("Inflated users are less than passed users");
            }

            for (const inflated of inflatedItems) {
                if (requiredFields.every((f) => f in inflated)) result.inflated.push(inflated);
                else result.notInflated.push(inflated);
                for (const optionalField of optionalFields) if (!(optionalField in inflated)) inflated[optionalField] = undefined; //introduce the optional field to the obj to prevent future re-inflation attempt
            }
        }

        return result;
    }

    generateId() {
        return new mongoose.Types.ObjectId();
    }

    // pass path to check instance of
    convertToModelId(value: string, path = "_id", model: mongoose.Model<any, {}, {}, {}, any, any>, fromWhere: string): any {
        const instance = model.schema.paths[path]?.instance || "ObjectId";
        if (instance === "String") return value;
        if (instance === "Number") return +value;
        if (instance === "ObjectId")
            try {
                return new mongoose.Types.ObjectId(value);
            } catch (error) {
                logger.error(`convertToModelId: ${model.modelName}.${path}:${value} => ${instance}`, error);
                return value;
            }
        return value;
    }

    onModuleInit() {
        logger.debug(`Models registered in ${this.name}: [${this.connection.modelNames()}]`);
        this.connection.on("connected", async () => {
            logger.info(`${this.name} connected`);
        });

        this.connection.on("disconnected", () => {
            logger.error(`${this.name} disconnected`);
        });

        this.connection.on("error", (error) => {
            logger.error(`${this.name} connection error`, error);
        });

        this.connection.on("reconnectFailed", () => {
            logger.error(`${this.name} reconnection failed`);
        });
    }

    async onApplicationShutdown(signal: string) {
        logger.info(`${this.name} Received shutdown signal: ${signal}`);
        await this.connection.close();
        logger.info(`${this.name} connection closed`);
    }
}
