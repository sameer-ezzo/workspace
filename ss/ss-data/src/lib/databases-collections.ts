import { DbCollectionInfo } from "./db-collection-info";
import { DbConnectionOptions } from "./data-options";
import { DataService } from "./data.svr";


export interface IDbMigration {
    name: string
    up(dataService: DataService):Promise<void>
    down(dataService: DataService):Promise<void>
}

export type DatabasesCollections = {
    [database: `DB_${string}`]: {
        collections: DbCollectionInfo;
        dbConnectionOptions: DbConnectionOptions;
        migrations?: IDbMigration[]
    };
};
