import { DynamicModule, FactoryProvider, Module, Provider } from '@nestjs/common'
import { Broker, CommonModule, appName } from '@ss/common'
import { DbConnectionOptions } from './data-options'
import { DataChangeService } from './data.change.service'
import { DataService } from './data.svr'
import { DatabasesCollections } from './databases-collections'
import { logger } from './logger'


const defaultDbConnectionOptions = new DbConnectionOptions();

if (process.env.DBPREFIX) logger.error(`DBPREFIX is deprecated. Use DB_[NAME] convention inside your env vars instead.`)
if (process.env.DBNAME) logger.error(`DBNAME is deprecated. Use DB_[NAME] convention instead.`)
if (process.env.DBSVR) logger.error(`DBSVR is deprecated. Use DB_[NAME] convention instead.`)
if (process.env.DBPORT) logger.error(`DBPORT is deprecated. Use DB_[NAME] convention instead.`)
if (process.env.DBUSER) logger.error(`DBUSER is deprecated. Use DB_[NAME] convention instead.`)
if (process.env.DBPASS) logger.error(`DBPASS is deprecated. Use DB_[NAME] convention instead.`)


function getDbsProviders(databasesCollections: DatabasesCollections = {}, databases: any = {}, dbConnectionOptions: Partial<DbConnectionOptions> = {}): Provider[] {
    const _env = { ...databases, ...process.env }
    const prod = _env.NODE_PROD === 'production'
    if (!prod && !_env["DB_DEFAULT"]) _env["DB_DEFAULT"] = `mongodb://127.0.0.1:27017/${appName ?? 'test'}`

    const dbProviders = Object.keys(_env)
        .filter(name => name.startsWith("DB_"))
        .map((provide: string) => {
            const _options = {
                ...defaultDbConnectionOptions,
                ...dbConnectionOptions
            }
            const url = _env[provide]
            const options = {
                ..._options,
                ...databasesCollections[provide]?.dbConnectionOptions ?? _options
            }

            if (url.startsWith('mongodb')) {
                const databaseInfo = databasesCollections[provide] ?? {}
                const collections = databaseInfo.collections ?? {}
                const migrations = databaseInfo.migrations ?? []

                logger.info("provide: ", provide, url, options, Object.keys(collections), migrations?.map(m => m.name))
                return {
                    provide,
                    useFactory: (broker: Broker) => DataService.create(provide, url, options, collections, migrations, broker),
                    inject: [Broker]
                } as FactoryProvider
            }
            else logger.error(`Invalid ${provide} environment variable`)
        })
        .filter(x => x)

    return dbProviders
}




@Module({
    imports: [CommonModule],
    providers: [DataService, DataChangeService],
    exports: [DataService, DataChangeService]
})
export class DataModule {
    static register(databasesCollections: DatabasesCollections = {}, databases?: { [name: string]: string }, dbConnectionOptions: Partial<DbConnectionOptions> = {}): DynamicModule {


        const dbsProviders = getDbsProviders(databasesCollections, databases, dbConnectionOptions)
        dbsProviders.push({ provide: DataService, useExisting: "DB_DEFAULT" })

        return {
            module: DataModule,
            providers: [DataService, DataChangeService, ...dbsProviders],
            exports: [DataService, DataChangeService, ...dbsProviders]
        };
    }
}
