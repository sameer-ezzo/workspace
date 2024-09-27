import mongoose from 'mongoose';

import { Injectable, OnModuleInit } from '@nestjs/common';

import { logger } from './logger';

import { IDbMigration } from './databases-collections';
import migrationSchema, { MigrationModel } from './migration-schema';
import { groupBy, sortBy } from 'lodash';
import { DataService } from './data.svr';

@Injectable()
export class MigrationsService {
    constructor(
        public readonly data: DataService,
        public readonly migrations: IDbMigration[],
    ) {
        this.migrate(this.migrations);
    }

    private async migrate(migrations: IDbMigration[]) {
        try {
            const connection = this.data.connection;
            if (connection && connection.readyState !== 1) {
                connection.on('connected', () => {
                    this.migrate(migrations);
                });
                return;
            }

            let model = await this.data.getModel('migration');
            if (!model) model = await this.data.addModel('migration', migrationSchema);

            const migrationsInDb = await model.find({}).lean();

            const migrationsByCollection = groupBy(
                migrations,
                (m) => m.collectionName,
            );
            const migrationsInDbByCollection = groupBy(
                migrationsInDb,
                (m) => m.collectionName,
            );

            const throwMismatchError = (msg?: string) => {
                const reason = `Migrations mismatch ${msg ? `!: ${msg}` : '!'}`;
                logger.error(reason);
                throw new Error(reason);
            };
            for (const collection in migrationsByCollection) {
                const ms = sortBy(
                    migrationsInDbByCollection[collection] ?? [],
                    (m) => m.date,
                );
                const migrations = migrationsByCollection[collection];
                if (ms.length > migrations.length)
                    throwMismatchError(
                        'Migrations in db are more than the migrations in code',
                    );
                for (let i = 0; i < migrations.length; i++) {
                    if (i < ms.length) {
                        if (migrations[i].name !== ms[i].name)
                            throwMismatchError('Migration name mismatch');
                    } else {
                        // const migrationModel = await connection.collection(prefix + migrations[i].collectionName);
                        // if (!migrationModel) {
                        //     logger.warn(`Migration model not found for ${migrations[i].collectionName}. Migation skipped!`);
                        //     continue
                        // }
                        const session = await connection.startSession();
                        session.startTransaction();
                        try {
                            await migrations[i].up?.(this.data, { session });
                            await model.create(
                                [
                                    {
                                        _id: this.data.generateId(),
                                        name: migrations[i].name,
                                        date: new Date(),
                                        collectionName:
                                            migrations[i].collectionName,
                                        documentVersion: 1,
                                        lockVersion: 0,
                                    } as unknown as MigrationModel,
                                ],
                                { session },
                            );
                            await session.commitTransaction();
                        } catch (error) {
                            await session.abortTransaction();
                            logger.error(
                                `Error on migration: ${migrations[i].name}`,
                                error,
                            );
                        } finally {
                            await session.endSession();
                        }
                    }
                }
            }
        } catch (error) {
            logger.error(`Error on migration: ${this.data.name}`, error);
        }
    }
}
