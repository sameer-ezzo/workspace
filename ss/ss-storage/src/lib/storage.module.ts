import { DynamicModule, Inject, Module, OnModuleInit } from "@nestjs/common";
import { CommonModule } from "@ss/common";
import { DataModule, DataService } from "@ss/data";
import { RulesModule } from "@ss/rules";

import { ImageService } from "./image.svr";
import { ImageController } from "./image.controller";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";
import fileSchema from "./schema";
import { MongooseModule } from "@nestjs/mongoose";
import { Schema } from "mongoose";

export class StorageModule implements OnModuleInit {
    constructor(@Inject(DataService) public readonly data: DataService) {}
    async onModuleInit() {
        // await this.data.addModel('storage', fileSchema);
    }
    static register(
        options: { dbName: string; storageSchema: Schema; prefix?: string } = {
            dbName: "DB_DEFAULT",
            storageSchema: fileSchema,
        },
    ): DynamicModule {
        options ?? { dbName: "DB_DEFAULT", storageSchema: fileSchema };
        options.prefix ??= "";
        const storageSchema = options.storageSchema;

        return {
            global: true,
            module: StorageModule,
            imports: [
                RulesModule,
                CommonModule,
                DataModule,
                MongooseModule.forFeature([{ name: "storage", collection: `${options.prefix}storage`, schema: storageSchema }], "DB_DEFAULT"),
            ],
            controllers: [StorageController, ImageController],
            providers: [StorageService, ImageService, { provide: "STORAGE_SCHEMA", useValue: storageSchema }],
            exports: [{ provide: "STORAGE_SCHEMA", useValue: storageSchema }, StorageService, ImageService, MongooseModule],
        };
    }
}
