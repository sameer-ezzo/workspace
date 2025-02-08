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
    static async migrate(data: DataService, migrations: IDbMigration[]) {
        const databaseName = data.name;
        const dbIsReady = await new Promise((resolve) => {
            if (data.connection.readyState === 1) {
                resolve(true);
            } else {
                data.connection.on("connected", () => {
                    resolve(true);
                });
            }
        });

        const throwMismatchError = (msg?: string) => {
            const reason = `Migrations mismatch ${msg ? `!: ${msg}` : "!"}`;
            logger.error(reason);
            throw new MigrationError(reason);
        };
        migrations ??= [];

        let model = await data.getModel("migration");
        if (!model) model = await data.addModel("migration", migrationSchema);

        const dbMigrations = await model.find({}).lean();
        // check should look for the migration in the db with the same name
        logger.info(`Migrating: ${data.name} - ${migrations.length} migrations to run, ${dbMigrations.length} migrations in db`);
        if (dbMigrations.length > migrations.length) throwMismatchError("Migrations in db are more than the migrations in code");
        if (dbMigrations.length === migrations.length) {
            logger.info(`Migrations are up to date on ${databaseName}`);
            return;
        }

        for (const migration of migrations) {
            if (dbMigrations.find((m) => m.name === migration.name) || !("up" in migration) || typeof migration.up !== "function") continue;
            logger.info(`Migrating: ${migration.name} on ${databaseName}`);
            // const session = await data.connection.startSession();
            // session.startTransaction();
            try {
                await migration.up(data);
                const res = await model.create([
                    {
                        _id: data.generateId(),
                        name: migration.name,
                        date: new Date(),
                        collectionName: migration.collectionName,
                        documentVersion: migration.documentVersion ?? 1,
                        lockVersion: 0,
                    } as unknown as MigrationModel,
                ]);

                // await session.commitTransaction();
                dbMigrations.push(res[0]._doc);
                // await session.endSession();
                // await delay(250);
            } catch (error) {
                // await session.abortTransaction();
                // await session.endSession();
                const msg = `Migration on ${databaseName} Error`;
                logger.error(msg, error);
                throw new MigrationError(msg);
            }
        }

        logger.info(`Migrated: ${data.name}`);
    }
}
