import { Controller, Inject, Optional } from '@nestjs/common';
import { EndPoint } from '@ss/common';
import { NotificationService } from './notification.svr';
import { DataService } from '@ss/data';
import { Schema } from 'mongoose';

@Controller('notification')
export class NotificationController {
    //TODO user settings

    constructor(
        public notification: NotificationService,
        @Inject('DB_NOTIFICATION') @Optional() public data: DataService,
    ) {
        // data.addModel('notification', new Schema({}, { strict: false }))
    }

    @EndPoint({ http: { path: 'public-key' } })
    PublicKey() {
        return process.env.VAPID_PUBLIC_KEY;
    }
}
