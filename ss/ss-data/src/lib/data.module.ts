import { DynamicModule, FactoryProvider, Inject, Module, OnModuleInit, Provider } from "@nestjs/common";
import { Broker, CommonModule, appName } from "@ss/common";
import { DbConnectionOptions, DbConnectionOptionsFactory } from "./data-options";
import { DataChangeService } from "./data.change.service";
import { DataService } from "./data.svr";
import { DatabaseInfo, DatabasesOptions, IDbMigration } from "./databases-collections";
import { logger } from "./logger";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { MongooseModule, InjectConnection, getConnectionToken, Schema, ModelDefinition, AsyncModelFactory } from "@nestjs/mongoose";
import mongoose, { Connection, models } from "mongoose";
import { name } from "platform";
import { DbModelDefinitionInfo, ModelDefinitionInfo } from "./db-collection-info";
import migrationSchema from "./migration-schema";
import { options } from "marked";
import tagSchema from "./tag.schema";
import changeSchema from "./change-schema";
import { MigrationsService } from "./migrations.svr";

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

export class DataModule implements OnModuleInit {
    constructor(@Inject(DataService) public readonly data: DataService) {}
    async onModuleInit() {
        await this.data.addModel("migration", migrationSchema);
        await this.data.addModel("tag", tagSchema);
        await this.data.addModel("change", changeSchema);
    }

    static register(databasesCollections: DatabasesOptions): DynamicModule {
        const options = toDataOptions(databasesCollections);
        const mongooseRoots = extractMongooseRoot(options);
        const mongooseFeatures = extractMongooseFeatures(options);
        const dataServicePerDbProviders: Provider[] = extractDataServiceProviders(options);
        const dataMigrationProviders: Provider[] = extractDataMigrationProviders(options);
        return {
            global: true,
            module: DataModule,
            imports: [CommonModule, ...mongooseRoots, ...mongooseFeatures],
            providers: [...dataServicePerDbProviders, ...dataMigrationProviders],
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
                const schemaOptions = model.schema?.["options"] ?? {};
                const schema = new mongoose.Schema(schemaObj, {
                    strict: false,
                    timestamps: true,
                    ...schemaOptions,
                });
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

function extractMongooseRoot(options: DataOptions[]) {
    return options.map(({ dbName, databaseInfo, models, migrations, connectionOptions }) => {
        const opts = { ...connectionOptions };
        delete opts.prefix;
        return MongooseModule.forRoot(databaseInfo.uri, {
            ...opts,
            connectionName: dbName,
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
            useFactory: (broker: Broker, connection: Connection) => {
                return new DataService(dbName, connection, connectionOptions, broker);
            },
            inject: [Broker, getConnectionToken(dbName)],
        } as FactoryProvider;
    });
    providers.push({
        provide: DataService,
        useExisting: getDataServiceToken("DB_DEFAULT"),
    });

    return providers;
}
export function getDataMigratorToken(dbName: string) {
    return `${dbName}_MIGRATOR`;
}
function extractDataMigrationProviders(options: DataOptions[]) {
    const providers: Provider[] = options.map(({ dbName, databaseInfo, models, migrations, connectionOptions }) => {
        return {
            provide: getDataMigratorToken(dbName),
            useFactory: (dataService: DataService) => {
                return new MigrationsService(dataService, migrations);
            },
            inject: [getDataServiceToken(dbName)],
        } as FactoryProvider;
    });
    providers.push({
        provide: MigrationsService,
        useExisting: getDataMigratorToken("DB_DEFAULT"),
    });
    return providers;
}
