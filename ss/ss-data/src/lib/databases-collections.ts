import { DbModelDefinitionInfo } from "./db-collection-info";
import type { DbConnectionOptions } from "./data-options";
import { DataService } from "./data.svr";
import { Schema } from "mongoose";

export interface IDbMigration {
    name: string;
    collectionName: string;
    schema: Schema;
    documentVersion?: number;
    up(dataService: DataService): Promise<void>;
    down(dataService: DataService): Promise<void>;
}

export type DatabaseInfo = {
    uri: string;
    models: DbModelDefinitionInfo;
    dbConnectionOptions?: DbConnectionOptions;
    migrations?: IDbMigration[];
};

export type DatabasesOptions = {
    DB_DEFAULT: DatabaseInfo;
    [database: string]: DatabaseInfo;
};
