import mongoose, { ConnectOptions } from "mongoose";
import { Model, Document } from "mongoose";

import mongooseUniqueValidator from "mongoose-unique-validator";
import { PathInfo } from "@noah-ark/path-matcher";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JsonPointer } from "@noah-ark/json-patch";

import { Patch } from "./model";
import { DbConnectionOptions } from "./data-options";
import type { DbCollectionInfo } from "./db-collection-info";
import { Broker } from "@ss/common";
import { logger } from "./logger";

//const mongooseHidden = require('mongoose-hidden')();  this plugin forces schema

export type DocumentIdType = string | number | mongoose.Types.ObjectId

export type WriteResult<T> = {
    errors?: any[]
    _id: any
    document?: T
}

import toMongodb from 'jsonpatch-to-mongodb'
import { QueryParser } from "./api.query"
import changeSchema from "./change-schema"
import tagSchema from "./tag.schema"
import { DataChangedEvent } from "./data-changed-event"
import { IDbMigration } from "./databases-collections";
import migrationSchema, { MigrationModel } from "./migration-schema";
import { ObjectId } from "@noah-ark/common";


export const defaultMongoDbConnectionOptions: ConnectOptions = {
    autoIndex: true,
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
    connectTimeoutMS: 5000,
    family: 4, // Use IPv4, skip trying IPv6
}

mongoose.pluralize(undefined)

@Injectable()
export class DataService {

    static async create(name: string, url: string, options: DbConnectionOptions, collections: DbCollectionInfo, migrations: IDbMigration[], broker: Broker): Promise<DataService> {
        const ds = new DataService(name, url, options, collections, migrations, broker)
        await ds.connect()
        return ds
    }

    private async _migrate(ds: DataService, migrations: IDbMigration[]) {
        try {

            const model = await ds.getOrAddModel("migration");
            const ms = await model.find({}).lean();

            const throwMismatchError = () => {
                logger.error("Migrations mismatch");
                throw "Migrations mismatch";
            };

            if (ms.length > migrations.length) throwMismatchError();
            for (let i = 0; i < migrations.length; i++) {
                if (i < ms.length) {
                    if (migrations[i].name !== ms[i].name) throwMismatchError();
                } else {
                    await migrations[i].up?.(ds);
                    await model.create({
                        _id: ObjectId.generate(),
                        name: migrations[i].name,
                        date: new Date(),
                    } as MigrationModel);
                }
            }
        } catch (error) {
            logger.error(`Error on migration: ${ds.name}`, error)
        }
    }


    private _connecting: Promise<mongoose.Connection>
    private _connection: mongoose.Connection
    get connection(): mongoose.Connection { return this._connection }

    private _host: string
    private _port: string
    private _db: string

    get host(): string { return this._host }
    get port(): string { return this._port }
    get db(): string { return this._db }

    queryParser: QueryParser
    protected prefix = ''

    private async _connect(url: string, options: ConnectOptions = { autoIndex: true }): Promise<mongoose.Connection> {
        try {

            const _options = {
                ...defaultMongoDbConnectionOptions,
                ...options
            } as ConnectOptions

            const connection = await mongoose.createConnection(url, _options)

            const s = url.substring(10) //skip scheme
            const [fqdn, db] = s.split('/')
            const [host, port] = fqdn.split(':')

            this._db = db ?? 'test'
            this._host = host ?? 'localhost'
            this._port = port ?? '27017'

            return connection
        }
        catch (error) {
            if (error + "" !== "MongoError: Topology closed") {
                logger.error(`DB Connection error URI:${url}`, error)
            }
        }
    }

    async connect(): Promise<mongoose.Connection> {
        if (this._connection) return this._connection

        if (!this._connecting) {

            logger.warn(`DS:CONNECTING ${this.name}`)

            const { bufferCommands, user, pass, autoIndex, autoCreate } = this.options
            const connectionOptions = { bufferCommands, user, pass, autoIndex, autoCreate }

            this._connecting = this._connect(this.url, connectionOptions)
            this._connection = await this._connecting
            this._connecting = null


            logger.warn(`DS:CONNECTED ${this.name} @ mongo://${this.host}:${this.port}/${this.db}`)


            await this._initCollections(this.collections)
            await this._migrate(this, this.migrations)
        }
        return this._connecting
    }


    constructor(
        public readonly name: string,
        public readonly url: string,
        public readonly options: DbConnectionOptions,
        public readonly collections: DbCollectionInfo,
        public readonly migrations: IDbMigration[],
        protected readonly broker: Broker) {

        this.queryParser = new QueryParser()
        this.prefix = this.options.prefix ?? process.env.DBPREFIX ?? ''
    }

    private async _initCollections(collections: DbCollectionInfo) {
        if (!collections["migration"]) collections["migration"] = { schema: migrationSchema }
        if (!collections["tag"]) collections["tag"] = { schema: tagSchema }
        if (!collections["change"]) collections["change"] = { schema: changeSchema }; //todo: to be removed and registered in the constructor by the data change module or service if needed
        const keys = Object.keys(collections ?? {})
            .filter(name => name && collections[name]?.schema)
        for (const name of keys) {
            try {
                await this.addModel(name, collections[name].schema, undefined, <string[]>this.collections[name].exclude)
            } catch (error) {
                logger.error(`Error on adding schema: ${name}`, error)
            }
        }
        this._updateModelsFromDb()
    }

    private _models: { [name: string]: Model<any> } = {};
    private _exclusions: { [name: string]: string[] } = {};

    async getOrAddModel(name: string, idType = String): Promise<Model<any>> {
        const model = await this.getModel(name);
        if (model) return model;
        else {
            return this.addModel(name, this.getDynamicSchema(idType));
        }
    }

    async getModel<T extends Document = any>(name: string, prefix?: string): Promise<Model<T> | undefined> {
        await this.connect()

        prefix ??= this.prefix
        const result = this._models[prefix + name]
        return result
    }
    private async _updateModelsFromDb() {
        const collections = this._connection.collections
        for (const collection in collections) {
            if (!this._models[collection])
                this.addModel(collection, this.getDynamicSchema(String), "")

        }
    }

    getExclusions(name: string): string[] {
        return this._exclusions[name]
    }

    async addModel(collection: string, schema: mongoose.Schema = this.getDynamicSchema(String), prefix?: string, exclude: string[] = [], overwrite = false): Promise<Model<any>> {
        await this.connect()
        prefix ??= this.prefix
        const cName = prefix + collection
        if (this._models[cName] && !overwrite)
            return this._models[cName]

        logger.info(`Adding schema: [${cName}] overwrite:${overwrite}`)
        schema.plugin(mongooseUniqueValidator)

        this._models[prefix + collection] = this._connection.model(cName, schema)

        if (exclude?.length > 0) this.addExclusion(cName, exclude)
        logger.info(`Schema: [${cName}] has been added successfully!`)
        return this._models[prefix + collection]
    }
    addExclusion(name: string, exclude: string[]) {
        this._exclusions[name] = exclude;
    }


    getDynamicSchema()
    getDynamicSchema(idType: 'string' | 'ObjectId')
    getDynamicSchema(idType: mongoose.SchemaDefinitionProperty)
    getDynamicSchema(idType?: unknown) {

        idType = idType ?? String

        const schema = new mongoose.Schema({}, { strict: false });

        let _idType: mongoose.SchemaDefinitionProperty

        if (idType === 'ObjectId') _idType = mongoose.SchemaTypes.ObjectId
        else if (idType === 'string') _idType = String
        else _idType = idType

        schema.add({ _id: _idType });
        return schema;
    }

    async find<T>(modelName: string, id?: DocumentIdType, pointer?: string, projection?: any, query?: any, sort?: any, page = 1, per_page = 100): Promise<T | T[]> {
        if (!query) query = {};
        if (!sort) sort = {};
        if (!projection) projection = {};

        if (id) { query["_id"] = id; }
        const exclude = this.getExclusions(modelName) || [];

        if (exclude.length) {
            const includes = Object.keys(projection);
            if (includes.length) exclude.forEach(x => delete projection[x]); //remove included fields that are supposed to be excluded
            if (Object.keys(projection).length === 0) exclude.forEach(x => projection[x] = 0);  //make sure to exclude in nothing included
        }

        const model = await this.getModel(modelName)


        if (id) {
            if (!model) return null
            const result = (await model.findById(id, projection).lean()) as T
            if (!result) return null

            try { return pointer ? JsonPointer.get(result, `/${pointer}`) : result }
            catch (error) { return null }
        }
        else {
            if (!model) return []
            const result = await model.find(query, projection)
                .limit(per_page).skip((page - 1) * per_page)
                .sort(sort)
                .lean()
            return (result ?? []) as T[]
        }
    }




    async get<T = any>(path: string | PathInfo, ...q: { [key: string]: string }[]): Promise<T> {
        let segments;
        try { segments = typeof path === 'string' ? PathInfo.parse(path) : path; }
        catch (error) { throw { status: 400, body: "INVALID_PATH" }; }

        let projection: any = {};
        if (segments.projectionPath) { projection[segments.projectionPath] = 1; }

        //const model = await this.getOrAddModel(segments.collection);
        const queryInfo = q ? this.queryParser.parse(<any>q) : null;
        const filter: any = queryInfo ? queryInfo.filter : {};
        const sort = queryInfo ? queryInfo.sort : {};
        const page = queryInfo ? +queryInfo.page : 1;
        const per_page = queryInfo ? queryInfo.per_page : 100;
        const select = queryInfo ? queryInfo.select : {};
        projection = { ...select, ...projection }

        return this.find<T | T[]>(segments.collection, segments.id, segments.pointer, projection, filter, sort, page, per_page) as Promise<T>
    }

    async count(path: string, ...q: { [key: string]: string }[]): Promise<number> {
        const result = await this.func(path, "count", ...q);
        return result || 0;
    }

    async func(path: string, f: "count", ...q: { [key: string]: string }[]) {
        let pathInfo;
        try { pathInfo = PathInfo.parse(path); } catch (error) { throw { status: 400, body: "INVALID_PATH" }; }

        const model = await this.getModel(pathInfo.collection);
        const queryInfo = q.length ? this.queryParser.parse(q) : null;
        const query: any = queryInfo ? queryInfo.filter : {};

        if (pathInfo.id) { query["_id"] = pathInfo.id; }


        switch (f) {
            case "count": return model ? model.countDocuments(query) : 0;
            default: return Promise.resolve(null);
        }
    }


    async agg<T>(path: string, million = false, ...q: { [key: string]: string }[]): Promise<T[]> {

        const Q: any = q;
        if (Q != null && !Array.isArray(Q))
            q = Object.keys(Q).map(key => { return { key, value: Q[key] } }); //convert to array if passed as object


        let pathInfo;
        try { pathInfo = PathInfo.parse(path); } catch (error) { throw { status: 400, body: "INVALID_PATH" }; }

        const model = await this.getModel(pathInfo.collection);
        if (!model) return Promise.resolve([])
        const query = q ? this.queryParser.parse(<any>q) : ({} as any);
        const pipeline = [];

        if (pathInfo.id) {
            pipeline.push({ $match: { _id: pathInfo.id } })
            if (query.select) pipeline.push({ $project: query.select });
        }
        else {
            const page = query.page || 1;
            const max_page_number = 100;
            const per_page = million ? 1000000 : Math.min(query.per_page || max_page_number, max_page_number);

            if (query.fields1) pipeline.push({ $addFields: query.fields1 });
            if (query.fields2) pipeline.push({ $addFields: query.fields2 });
            if (query.fields3) pipeline.push({ $addFields: query.fields3 });
            if (query.lookups) query.lookups.forEach((l: any) => {
                l.from = this.prefix + l.from;
                const unwind = l.unwind;
                delete l.unwind;
                pipeline.push({ $lookup: l });
                if (unwind) pipeline.push({ $unwind: '$' + l.as });
            });
            if (query.lookupsMatch) {
                query.lookupsMatch.forEach((l: any) => {
                    pipeline.push({
                        $lookup: {
                            from: this.prefix + l.from,
                            let: { l: "$" + l.localField },
                            pipeline: [
                                { $addFields: { joined: { $in: ['$' + l.foreignField, '$$l'] } } },
                                {
                                    $match: {
                                        $and: [
                                            { joined: true },
                                            ...l.match
                                        ]
                                    }
                                }, { $project: { joined: 0 } }
                            ],
                            as: l.as
                        }
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


    public async post<T = any>(path: string | PathInfo, newData: any, user?: any): Promise<{ _id: string, result: WriteResult<T> }> {
        let segments: PathInfo;
        try { segments = typeof path === 'string' ? PathInfo.parse(path) : path; }
        catch (error) { throw { status: 400, body: "INVALID_PATH" }; }

        const model = await this.getOrAddModel(segments.collection);
        if (segments.id) { //push to array field
            //if (!Array.isArray(oldData)) { throw { status: 400, body: "INVALID_POST" }; }
            const update = { $push: {} };
            if (segments.projectionPath) update.$push[segments.projectionPath] = newData;
            else update.$push = newData;

            const document = await model.findById(segments.id);
            if (!document) throw new HttpException("Not found", HttpStatus.NOT_FOUND);

            const result: any = await model.findByIdAndUpdate(segments.id, update, { new: true, upsert: true, lean: true });
            this.broker.emit<DataChangedEvent<T>>(`data-changed/${segments.path}`, {
                path: segments.path,
                data: result.value,
                patches: [{ op: "add", path: <string>segments.pointer, value: newData }],
                user
            })
            return { _id: newData._id, result: result }

        } else {
            if (!newData._id) newData._id = new mongoose.Types.ObjectId();
            else {
                const old = await model.countDocuments({ _id: newData._id });
                if (old) throw new HttpException("CANNOT_POST_OVER_EXISTING_DOCUMENT", HttpStatus.NOT_ACCEPTABLE);
            }

            const result: any = await model.findByIdAndUpdate(newData._id, newData, { new: true, upsert: true, lean: true });
            this.broker.emit(`data-changed/${segments.path}/${newData._id}`, {
                path: `${segments.path}/${newData._id}`,
                data: result.value,
                patches: [{ op: "add", path: "/", value: result }],
                user
            })
            return { _id: newData._id, result }
        }
    }

    async patch<T = any>(path: string, patches: Patch[], user: any): Promise<WriteResult<T>> {
        const segments = path.split("/").filter(s => s);
        if (segments.length !== 2) { throw { status: 400, body: "INVALID_PATH_FOR_PATCH" }; }

        const collection = <string>segments.shift();
        const id = <string>segments.shift();
        const model = await this.getOrAddModel(collection);

        const directPatches = patches.filter(p => p.path === "/");

        let directPatch;
        let result;

        if (directPatches.length) {
            directPatch = directPatches[directPatches.length - 1];
            const lastDirectPatchIndex = patches.indexOf(directPatch);
            patches = patches.filter((p, i) => i > lastDirectPatchIndex);
            result = await model.findByIdAndUpdate(id, { $set: directPatch.value }, { upsert: true });
        }
        if (patches.length) {
            const update = toMongodb(patches);
            result = await model.findOneAndUpdate({ _id: id }, update, { new: true, upsert: false });
        }

        if (result)
            this.broker.emit(`data-changed/${collection}/${id}`, {
                path: `/${collection}/${id}`,
                data: result,
                patches: directPatch ? [directPatch, ...patches] : patches,
                user
            })


        return result
    }

    getPatches(path: string, value: any): Patch[] {
        return [{ op: "replace", path, value: value }];
    }
    async put<T = any>(path: string, value: any, user: any): Promise<WriteResult<T>> {

        const segments = path.split("/").filter(s => s);
        if (segments.length < 2) throw { status: 400, body: "INVALID_DOCUMENT_PATH" };

        const collection = <string>segments.shift();
        const id = <string>segments.shift();
        const patches = this.getPatches('/' + segments.join('/'), this.queryParser.autoParseValue(value));

        return this.patch<T>(`/${collection}/${id}`, patches, user);
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
                const result = await model.findByIdAndUpdate(segments.id, update, { new: true });
                this.broker.emit(`data-changed/${path}`, {
                    path,
                    data: result,
                    patches: [{ op: "remove", path: <string>segments.pointer }],
                    user
                })
                return { _id: segments.id, ...result } as WriteResult<T>;
            } else {
                const result = await model.findByIdAndDelete(segments.id);
                this.broker.emit(`data-changed/${path}`, {
                    path,
                    data: result,
                    patches: [{ op: "remove", path: "/" }],
                    user
                })
                return { _id: segments.id, ...result } as WriteResult<T>;
            }
        }
        else throw { status: 400, body: "INVALID_PATH" };
    }


    async inflate<T extends { _id: any }>(collection: string, deflatedItems: Partial<T>[], requiredFields: (keyof T)[], optionalFields: (keyof T)[] = [], inflateBy: (keyof T)[] = ['_id']): Promise<{ inflated: T[], notInflated: T[] }> {
        const result: { inflated: T[], notInflated: T[] } = { inflated: [], notInflated: [] }
        const toBeInflated: { [by in keyof T]?: any[] } = {}
        const fields = [...new Set([...requiredFields, ...optionalFields])]

        for (const deflated of deflatedItems) {
            if (fields.every(f => f in deflated)) result.inflated.push(deflated as T)
            else {
                for (const by of inflateBy) {
                    if (deflated[by]) {
                        toBeInflated[by] ??= []
                        toBeInflated[by].push(deflated[by])
                        break
                    }
                }
            }
        }

        const select = fields.join(',')
        for (const by of inflateBy) {
            if (!toBeInflated[by]) continue
            const inflatedItems = await this.agg<T>(`/${collection}`, true, { select, [by]: `{in}${toBeInflated[by].join(',')}` })
            if (inflatedItems.length !== toBeInflated[by].length) {
                logger.error("Inflated users are less than passed users")
            }

            for (const inflated of inflatedItems) {
                if (requiredFields.every(f => f in inflated)) result.inflated.push(inflated)
                else result.notInflated.push(inflated)
                for (const optionalField of optionalFields)
                    if (!(optionalField in inflated))
                        inflated[optionalField] = undefined //introduce the optional field to the obj to prevent future re-inflation attempt
            }
        }

        return result
    }


    generateId(): string {
        return new mongoose.Types.ObjectId().toHexString()
    }
}
