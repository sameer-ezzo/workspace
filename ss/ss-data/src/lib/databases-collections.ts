import { DbModelDefinitionInfo } from './db-collection-info';
import { DbConnectionOptions } from './data-options';
import { DataService } from './data.svr';
import { Schema } from 'mongoose';

export interface IDbMigration {
  name: string;
  collectionName: string;
  schema: Schema;
  up(dataService: DataService, ctx: { session: any }): Promise<void>;
  down(dataService: DataService, ctx: { session: any }): Promise<void>;
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
