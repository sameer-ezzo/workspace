import { DynamicModule, Module } from '@nestjs/common';
import { CommonModule } from '@ss/common';
import { DataModule } from '@ss/data';
import { RulesModule } from '@ss/rules'

import { ImageService } from './image.svr';
import { ImageController } from './image.controller';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';


@Module({
    controllers: [StorageController, ImageController],
    providers: [StorageService, ImageService],
    exports: [StorageService, ImageService],
    imports: [RulesModule, CommonModule, DataModule]
})
export class StorageModule {
    static register(): DynamicModule {
        return {
            module: StorageModule,
            controllers: [StorageController, ImageController],
            providers: [StorageService, ImageService],
            exports: [StorageService, ImageService]
        };
    }
}
