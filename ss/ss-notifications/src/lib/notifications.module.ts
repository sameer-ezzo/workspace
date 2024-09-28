import {
    DynamicModule,
    Inject,
    Module,
    OnModuleInit,
    Provider,
} from '@nestjs/common';
import { DataModule, DataService } from '@ss/data';
import { ModuleRef } from '@nestjs/core';
import { NotificationService } from './notification.svr';
import { NotificationController } from './notification.controller';
import { NotificationChannel } from './notification-channel';
import { NotificationOptions } from './notification';
import { CommonModule } from '@ss/common';
import { Schema } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';

export type Topics = {
    [topic: string]: { channels: string[]; options?: NotificationOptions };
};

export class NotificationsModule implements OnModuleInit {
    constructor(public readonly data: DataService) {}
    async onModuleInit() {
        // await this.data.addModel(
        //     'notification',
        //     new Schema({}, { strict: false })
        // );
    }
    static register(
        channels: (NotificationChannel | Provider)[],
        topics: Topics = {},
        config = { dbName: 'DB_DEFAULT', readNotificationSettings: true }
    ): DynamicModule {
        const _providers: Provider[] = [];
        for (const channel of channels) {
            if ('name' in channel)
                _providers.push({ provide: channel.name, useValue: channel });
            else _providers.push(channel);
        }

        _providers.push({
            provide: 'DB_NOTIFICATION',
            useExisting: config.dbName,
        });
        topics ??= {};

        if (Object.keys(topics).length) {
            if (config.readNotificationSettings) {
                for (const topic in topics) {
                    topics[topic].options ??= {
                        store: false,
                        additionalFields: [],
                    };
                    topics[topic].options.additionalFields.push(
                        'notificationSettings'
                    ); //load user's notificationSettings objects
                }
            }

            _providers.push({
                provide: NotificationService,
                useFactory: (injector: ModuleRef, data: DataService) => {
                    const svr = new NotificationService(injector, data);
                    for (const topic in topics) {
                        svr.addChannels(topic, ...topics[topic].channels);
                    }
                    return svr;
                },
                inject: [ModuleRef, 'DB_NOTIFICATION'],
            });
        } else _providers.push(NotificationService);

        return {
            global: true,
            module: NotificationsModule,
            imports: [
                CommonModule,
                DataModule,
                MongooseModule.forFeature(
                    [
                        {
                            name: 'notification',
                            schema: new Schema({}, { strict: false }),
                        },
                    ],
                    config.dbName
                ),
            ],
            controllers: [NotificationController],
            providers: _providers,
            exports: [..._providers, MongooseModule],
        } as DynamicModule;
    }
}
