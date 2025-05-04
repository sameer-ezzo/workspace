import { DynamicModule, FactoryProvider, Inject, OnModuleInit, Provider } from "@nestjs/common";
import { Broker } from "@ss/common";
import { DbConnectionOptions, DbConnectionOptionsFactory } from "./data-options";
import { DataService } from "./data.svr";
import { DatabaseInfo, DatabasesOptions, IDbMigration } from "./databases-collections";
import { logger } from "./logger";

import { MongooseModule, getConnectionToken, ModelDefinition } from "@nestjs/mongoose";
import mongoose, { Connection, Schema } from "mongoose";
import { DbModelDefinitionInfo, ModelDefinitionInfo } from "./db-collection-info";
import migrationSchema from "./migration-schema";
import changeSchema from "./change-schema";
import { TagSchema } from "./tag.schema";

const defaultDbConnectionOptions: DbConnectionOptions = DbConnectionOptionsFactory.createMongooseOptions("DB_DEFAULT", {
    retryAttempts: 5,
    retryDelay: 5000,
});

if (process.env.DBPREFIX) logger.error(`DBPREFIX is deprecated. Use DB_[NAME] convention inside your env vars instead.`);
if (process.env.DBNAME) logger.error(`DBNAME is deprecated. Use DB_[NAME] convention instead.`);
if (process.env.DBSVR) logger.error(`DBSVR is deprecated. Use DB_[NAME] convention instead.`);
if (process.env.DBPORT) logger.error(`DBPORT is deprecated. Use DB_[NAME] convention instead.`);
if (process.env.DBUSER) logger.error(`DBUSER is deprecated. Use DB_[NAME] convention instead.`);
if (process.env.DBPASS) logger.error(`DBPASS is deprecated. Use DB_[NAME] convention instead.`);

// @Global()
export class DataModule implements OnModuleInit {
    constructor(@Inject(DataService) public readonly data: DataService) {}
    async onModuleInit() {
        // await this.data.addModel("migration", migrationSchema);
        // await this.data.addModel("tag", TagSchema);
        // await this.data.addModel("change", changeSchema);
    }

    static register(databasesCollections: DatabasesOptions): DynamicModule {
        const options = toDataOptions(databasesCollections);
        const mongooseRoots = extractMongooseRoot(options);
        const mongooseFeatures = extractMongooseFeatures(options);
        const dataServicePerDbProviders: Provider[] = extractDataServiceProviders(options);
        return {
            global: true,
            module: DataModule,
            imports: [...mongooseRoots, ...mongooseFeatures],
            providers: [...dataServicePerDbProviders],
            exports: [MongooseModule, ...dataServicePerDbProviders],
        };
    }
}
type DataOptions = {
    dbName: string;
    databaseInfo: any;
    models: DbModelDefinitionInfo;
    migrations: IDbMigration[];
    connectionOptions: DbConnectionOptions;
    // inMemory?: boolean;
};
function toDataOptions(options: DatabasesOptions): DataOptions[] {
    return Object.getOwnPropertyNames(options).map((dbName) => {
        const databaseInfo = ((options as DatabasesOptions)[dbName] ?? {}) as DatabaseInfo;
        const models = databaseInfo.models ?? {};
        const migrations = databaseInfo.migrations ?? [];
        const _options = {
            ...defaultDbConnectionOptions,
            ...databaseInfo.dbConnectionOptions,
        };
        const connectionOptions = { ..._options };
        return { dbName, databaseInfo, models, migrations, connectionOptions };
    });
}

function extractMongooseFeatures(options: DataOptions[]) {
    return options.map(({ dbName, databaseInfo, models, migrations, connectionOptions }) => {
        const prefix = connectionOptions.prefix ?? "";
        return MongooseModule.forFeature(
            Object.getOwnPropertyNames(models).map((modelName) => {
                const model = models[modelName] as unknown as ModelDefinitionInfo;
                const schemaObj = model.schema?.obj ?? {};
                const schemaOptions = { strict: false, timestamps: true, ...(model.options ?? {}), ...model.schema?.["options"] };
                const schema = new mongoose.Schema(schemaObj, schemaOptions);
                if ((model.exclude ?? []).length) {
                    schema.set("toJSON", {
                        transform: function (doc: any, ret: any) {
                            for (const ex of model.exclude) {
                                delete ret[ex];
                            }
                        },
                    });
                }
                const modelDef = {
                    name: modelName,
                    collection: prefix + modelName,
                    discriminators: models[modelName].discriminators,
                    schema,
                } as unknown as ModelDefinition;

                return modelDef;
            }),
            dbName,
        );
    });
}
// import { MongoMemoryServer } from "mongodb-memory-server";
function extractMongooseRoot(options: DataOptions[]) {
    return options.map(({ dbName, databaseInfo, models, migrations, connectionOptions }) => {
        const opts = { ...connectionOptions };
        delete opts.prefix;
        // if (inMemory) {
        //     return MongooseModule.forRootAsync({
        //         useFactory: async () => {
        //             const mongoServer = await MongoMemoryServer.create();
        //             const uri = mongoServer.getUri();
        //             return {
        //                 ...opts,
        //                 uri,
        //                 connectionName: dbName,
        //             };
        //         },
        //     });
        // }

        // return MongooseModule.forRoot(databaseInfo.uri, {
        //     connectionFactory: (connection) => {
        //         const migrator = MigrationsService.create(connection, migrations);
        //         return connection;
        //     },
        //     ...opts,
        //     connectionName: dbName,
        // });

        return MongooseModule.forRoot(databaseInfo.uri, {
            ...opts,
            connectionName: dbName,
            serverSelectionTimeoutMS: 10000, // Wait up to 10s for MongoDB to respond
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
    }) as any;
}
export function getDataServiceToken(dbName: string) {
    return `${dbName}_DATA_SERVICE`;
}

function extractDataServiceProviders(options: DataOptions[]) {
    const providers: Provider[] = options.map(({ dbName, databaseInfo, models, migrations, connectionOptions }) => {
        return {
            provide: getDataServiceToken(dbName),
            useFactory: (broker: Broker, connection: Connection) => DataService.create(dbName, connection, connectionOptions, broker, migrations),
            inject: [Broker, getConnectionToken(dbName)],
        } as FactoryProvider;
    });
    providers.push({
        provide: DataService,
        useExisting: getDataServiceToken("DB_DEFAULT"),
    });

    return providers;
}
