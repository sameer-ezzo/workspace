import mongoose, { Connection, ConnectOptions } from "mongoose";
import { Model, Document } from "mongoose";

import mongooseUniqueValidator from "mongoose-unique-validator";
import { PathInfo } from "@noah-ark/path-matcher";
import { HttpException, HttpStatus, Inject, Injectable, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import { JsonPointer } from "@noah-ark/json-patch";

import { Patch } from "./model";
import { DbConnectionOptions } from "./data-options";
import { Broker } from "@ss/common";
import { logger } from "./logger";

//const mongooseHidden = require('mongoose-hidden')();  this plugin forces schema

export type DocumentIdType = string | number | mongoose.Types.ObjectId;

export type WriteResult<T> = {
    _id: any;
    document?: T;
    errors?: any[];
};

import toMongodb from "jsonpatch-to-mongodb";
import { QueryParser } from "./api.query";
import { DataChangedEvent } from "./data-changed-event";
import { MigrationsService } from "./migrations.svr";
import { IDbMigration } from "./databases-collections";

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
    static async create(dbName: string, connection: mongoose.Connection, connectionOptions: DbConnectionOptions, broker: Broker, migrations: IDbMigration[]) {
        logger.info(`Creating DataService for ${dbName}`);
        const service = new DataService(dbName, connection, connectionOptions, broker);
        await MigrationsService.migrate(service, migrations);
        await service.connection.syncIndexes();
        logger.info(`DataService for ${dbName} created successfully!`);
        return service;
    }
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
        logger.info(`DataService created for ${name} with prefix: ${this.prefix}`);
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

        const model = await this.getModel(modelName);

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
            throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);
        }

        let projection: any = {};
        if (segments.projectionPath) {
            projection[segments.projectionPath] = 1;
        }

        const model = await this.getModel(segments.collection);
        const queryInfo = q ? this.queryParser.parse(q, model) : null;
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
            throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);
        }

        const model = await this.getModel(pathInfo.collection);
        const queryInfo = q.length ? this.queryParser.parse(q) : null;
        const query: any = queryInfo ? queryInfo.filter : {};

        if (pathInfo.id) {
            const _id = this.convertToModelId(pathInfo.id, "_id", model, `func(${f}) ${path} ${q}`);
            if (!_id) throw new HttpException({ body: "INVALID_ID" }, HttpStatus.NOT_FOUND);
            query["_id"] = _id;
        }

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
            throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);
        }

        const model = await this.getModel(pathInfo.collection);
        if (!model) return Promise.resolve([]);
        const query: any = q ? this.queryParser.parse(q, model) : {};
        const pipeline = [];
        let _id = undefined;
        if (pathInfo.id) {
            _id = this.convertToModelId(pathInfo.id, "_id", model, `agg ${path} ${q}`);
            if (!_id) throw new HttpException({ body: "INVALID_ID" }, HttpStatus.NOT_FOUND);

            pipeline.push({ $match: { _id } });
            if (query.select) pipeline.push({ $project: query.select });
        } else {
            const page = query.page || 1;
            const max_page_number = 1000;
            const per_page = million ? 1000000 : Math.min(query.per_page || max_page_number, max_page_number);

            const $and = (query.filter?.$and as Record<string, any>[]) ?? [];
            const pre_filter = [];
            const post_filter = [];
            for (const f of $and) {
                if (Object.keys(f).some((k) => k.startsWith("$") || k.includes("."))) {
                    post_filter.push(f);
                } else {
                    pre_filter.push(f);
                }
            }

            if (query.fields1) pipeline.push({ $addFields: query.fields1 });
            if (query.fields2) pipeline.push({ $addFields: query.fields2 });
            if (pre_filter.length) pipeline.push({ $match: { $and: pre_filter } });
            if (query.$text) {
                pipeline.push({ $match: { $text: { $search: query.$text } } });
                pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
            }
            if (query.lookups)
                query.lookups.forEach((l: any) => {
                    l.from = this.prefix + l.from;
                    const unwind = l.unwind;
                    delete l.unwind;
                    pipeline.push({ $lookup: l });
                    if (unwind) pipeline.push({ $unwind: { path: "$" + l.as, preserveNullAndEmptyArrays: true } });
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
            if (query.fields3) pipeline.push({ $addFields: query.fields3 });
            if (post_filter.length) pipeline.push({ $match: { $and: post_filter } });
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

    async aggCount<T>(path: string, million = false, ...q: { [key: string]: string }[]): Promise<number> {
        const Q: any = q;
        if (Q != null && !Array.isArray(Q))
            q = Object.keys(Q).map((key) => {
                return { key, value: Q[key] };
            }); //convert to array if passed as object

        let pathInfo;
        try {
            pathInfo = PathInfo.parse(path);
        } catch (error) {
            throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);
        }

        const model = await this.getModel(pathInfo.collection);
        if (!model) return Promise.resolve(0);
        const query: any = q ? this.queryParser.parse(q, model) : {};
        const pipeline = [];
        let _id = undefined;
        if (pathInfo.id) {
            _id = this.convertToModelId(pathInfo.id, "_id", model, `agg ${path} ${q}`);
            if (!_id) throw new HttpException({ body: "INVALID_ID" }, HttpStatus.NOT_FOUND);

            pipeline.push({ $match: { _id } });
            if (query.select) pipeline.push({ $project: query.select });
        } else {
            const page = query.page || 1;
            const max_page_number = 100;
            const per_page = million ? 1000000 : Math.min(query.per_page || max_page_number, max_page_number);

            const $and = (query.filter?.$and as Record<string, any>[]) ?? [];
            const pre_filter = [];
            const post_filter = [];

            for (const f of $and) {
                if (Object.keys(f).some((k) => k.startsWith("$") || k.includes("."))) {
                    post_filter.push(f);
                } else {
                    pre_filter.push(f);
                }
            }

            if (query.fields1) pipeline.push({ $addFields: query.fields1 });
            if (query.fields2) pipeline.push({ $addFields: query.fields2 });
            if (pre_filter.length) pipeline.push({ $match: { $and: pre_filter } });
            if (query.lookups)
                query.lookups.forEach((l: any) => {
                    l.from = this.prefix + l.from;
                    const unwind = l.unwind;
                    delete l.unwind;
                    pipeline.push({ $lookup: l });
                    if (unwind) pipeline.push({ $unwind: { path: "$" + l.as, preserveNullAndEmptyArrays: true } });
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
            if (query.fields3) pipeline.push({ $addFields: query.fields3 });
            if (post_filter.length) pipeline.push({ $match: { $and: post_filter } });
            if (query.$text) {
                pipeline.push({ $match: { $text: { $search: query.$text } } });
                pipeline.push({ $addFields: { score: { $meta: "textScore" } } });
            }
            if (query.sort) pipeline.push({ $sort: query.sort });
            if (query.select) pipeline.push({ $project: query.select });

            const setLimitsBeforeGrouping = query.group === null || query.group?.items !== null; //limit before if document is included

            if (setLimitsBeforeGrouping) {
                pipeline.push({ $count: "count" });
            }

            if (query.group) pipeline.push({ $group: query.group });

            if (!setLimitsBeforeGrouping) {
                pipeline.push({ $count: "count" });
            }
        }
        const result = (await model.aggregate(pipeline)) as [{ count: number }];
        return result?.[0].count ?? 0;
    }

    public async post<T = any>(path: string | PathInfo, newData: any, user?: any): Promise<WriteResult<T>> {
        let segments: PathInfo;
        try {
            segments = typeof path === "string" ? PathInfo.parse(path) : path;
        } catch (error) {
            throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);
        }

        const model = await this.getModel(segments.collection);
        if (segments.projectionPath) {
            //push to array field
            //if (!Array.isArray(oldData)) { throw new HttpException("INVALID_POST", HttpStatus.NOT_ACCEPTABLE); }
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
            return { _id: newData._id, document: result };
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
            return { _id: newData._id, document: result };
        }
    }

    private _generatePatches(value: any, currentPath = ""): Patch[] {
        let patches: Patch[] = [];

        if (typeof value !== "object" || value === null) {
            // Base case: if the value is a primitive (or null), create a patch directly
            patches.push({ op: "replace", path: currentPath, value });
        } else if (Array.isArray(value)) {
            // Handle arrays
            value.forEach((item, index) => {
                patches = patches.concat(this._generatePatches(item, `${currentPath}/${index}`));
            });
        } else {
            // Handle objects
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    patches = patches.concat(this._generatePatches(value[key], `${currentPath}/${key}`));
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
            lean: false,
        },
    ): Promise<WriteResult<T>> {
        const segments = path.split("/").filter((s) => s);
        if (segments.length !== 2) {
            throw new HttpException({ body: "INVALID_PATH_FOR_PATCH" }, HttpStatus.BAD_REQUEST);
        }

        const collection = <string>segments.shift();
        const id = <string>segments.shift();
        const model = await this.getModel(collection);
        const doc = await model.findById(id).lean();
        if (!doc) throw new HttpException({ body: "NOT_FOUND" }, HttpStatus.NOT_FOUND);

        patches ??= [];
        const directPatches = patches.filter((p) => p.path === "/");

        let result;

        const _directPatches = [] as Patch[];
        if (directPatches.length) {
            const directPatch = directPatches[directPatches.length - 1];
            const lastDirectPatchIndex = patches.indexOf(directPatch);
            patches = patches.filter((p, i) => i > lastDirectPatchIndex);
            const updatePatches = this._generatePatches(directPatch.value, "");
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
                new: true,
            });
        }

        if (result) {
            this.broker.emit(`data-changed/${collection}/${id}`, {
                path: `/${collection}/${id}`,
                data: result,
                patches,
                user,
            });
        }

        return { _id: id, document: result };
    }

    toPatches<T = any>(path: string, value: any): { path: string; patches: Patch[] } {
        const segments = path.split("/").filter((s) => s);
        if (segments.length < 2) throw new HttpException({ body: "INVALID_DOCUMENT_PATH" }, HttpStatus.BAD_REQUEST);

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
        let segments;
        try {
            segments = PathInfo.parse(path);
        } catch (error) {
            throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);
        }

        const model = await this.getModel(segments.collection);
        if (!model) throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);
        if (!segments.id) return this.post(path, value, user);

        const doc = await model.findById(segments.id).lean();
        if (!doc) return this.post(path, value, user);

        if (segments.projectionPath) {
            const document = await model.findByIdAndUpdate(segments.id, { $set: { [segments.projectionPath]: value } }, { new: true }).lean();
            return { _id: segments.id, document } as WriteResult<T>;
        } else {
            const document = await model.findOneAndReplace({ _id: segments.id }, value, { new: true }).lean();
            return { _id: segments.id, document } as WriteResult<T>;
        }

        // if (document)
        //     this.broker.emit(`data-changed/${segments.collection}/${segments.id}`, {
        //         path: `/${segments.collection}/${segments.id}`,
        //         data: document,
        //         user,
        //     });
    }

    async delete<T = any>(path: string, user: any): Promise<WriteResult<T>> {
        let segments;
        try {
            segments = PathInfo.parse(path);
        } catch (error) {
            throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);
        }

        const model = await this.getModel(segments.collection);
        if (!model) throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);

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
        } else throw new HttpException({ body: "INVALID_PATH" }, HttpStatus.BAD_REQUEST);
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
        if (!model) return value;
        const instance = model.schema.paths[path]?.instance || "ObjectId";
        if (instance === "String") return value;
        if (instance === "Number") return +value;
        if (instance === "ObjectId")
            try {
                return new mongoose.Types.ObjectId(value);
            } catch (error) {
                return undefined;
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
