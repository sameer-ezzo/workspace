import { MongooseModuleOptions } from '@nestjs/mongoose';

export interface DataBaseOptions {
  prefix?: string;
  autoCreateModel?: boolean;
}
export type DbConnectionOptions = MongooseModuleOptions & DataBaseOptions;

export class DbConnectionOptionsFactory {
  static createMongooseOptions(
    dbName?: string,
    params?: Partial<DbConnectionOptions>,
  ): DbConnectionOptions {
    const prefix =
      process.env[dbName + '_PREFIX'] ?? process.env.DBPREFIX ?? '';

    const options = {} as DbConnectionOptions;
    options.prefix = prefix;
    return Object.assign(options, params ?? {});
  }
}
