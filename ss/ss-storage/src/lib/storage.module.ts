import { DynamicModule, Inject, Module, OnModuleInit } from '@nestjs/common';
import { CommonModule } from '@ss/common';
import { DataModule, DataService } from '@ss/data';
import { RulesModule } from '@ss/rules';

import { ImageService } from './image.svr';
import { ImageController } from './image.controller';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import fileSchema from './schema';

export class StorageModule implements OnModuleInit {
    constructor(@Inject(DataService) public readonly data: DataService) {}
    onModuleInit() {
        this.data.addModel('storage', fileSchema);
    }
    static register(): DynamicModule {
        return {
            global: true,
            module: StorageModule,
            imports: [RulesModule, CommonModule, DataModule],
            controllers: [StorageController, ImageController],
            providers: [StorageService, ImageService],
            exports: [StorageService, ImageService],
        };
    }
}
