import { Injectable } from "@nestjs/common";

import { logger } from "./logger";

import { IDbMigration } from "./databases-collections";
import migrationSchema, { MigrationModel } from "./migration-schema";
import { DataService } from "./data.svr";
import { delay } from "@noah-ark/common";

// define new Migration Error
export class MigrationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MigrationError";
    }
}
@Injectable()
export class MigrationsService {
    static async create(data: DataService, migrations: IDbMigration[]) {
        const service = new MigrationsService(data, migrations);
        await service.migrate(migrations);
        return service;
    }
    constructor(
        private readonly data: DataService,
        private readonly migrations: IDbMigration[],
    ) {}

    private async migrate(migrations: IDbMigration[]) {
        const dbIsReady = await new Promise((resolve) => {
            if (this.data.connection.readyState === 1) {
                resolve(true);
            } else {
                this.data.connection.on("connected", () => {
                    resolve(true);
                });
            }
        });

        const throwMismatchError = (msg?: string) => {
            const reason = `Migrations mismatch ${msg ? `!: ${msg}` : "!"}`;
            logger.error(reason);
            throw new MigrationError(reason);
        };

        try {
            let model = await this.data.getModel("migration");
            if (!model) model = await this.data.addModel("migration", migrationSchema);

            const dbMigrations = await model.find({}).lean();
            if (dbMigrations.length > migrations.length) throwMismatchError("Migrations in db are more than the migrations in code");
            if (dbMigrations.length === migrations.length) return;

            const databaseName = this.data.connection.db.databaseName;
            for (const migration of migrations) {
                await delay(200);
                // wait till db initialized (indexes recreated,...)
                if (dbMigrations.find((m) => m.name === migration.name) || !("up" in migration) || typeof migration.up !== "function") continue;

                const session = await this.data.connection.startSession();
                try {
                    session.startTransaction();
                    logger.info(`Migrating: ${migration.name} on ${databaseName}`);
                    await migration.up(this.data, { session });
                    const res = await model.create(
                        [
                            {
                                _id: this.data.generateId(),
                                name: migration.name,
                                date: new Date(),
                                collectionName: migration.collectionName,
                                documentVersion: migration.documentVersion ?? 1,
                                lockVersion: 0,
                            } as unknown as MigrationModel,
                        ],
                        { session },
                    );
                    dbMigrations.push(res[0]._doc);
                    await session.commitTransaction();
                    await session.endSession();
                } catch (error) {
                    await session.abortTransaction();
                    await session.endSession();

                    const err = `Migration Error: ${migration.name} on ${databaseName}`;
                    logger.error(err, error);

                    // throw new MigrationError(`Error on migration: ${migrations[i].name}`);
                }
            }
        } catch (error) {
            logger.error(`Error on migration: ${this.data.name}`, error);
        }
    }
}
