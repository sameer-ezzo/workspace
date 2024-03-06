import { Controller } from '@nestjs/common';

import type { IncomingMessage } from '@noah-ark/common';
import { EventHandler } from './event-endpoint.decorator';
import { Message, ServiceAnouncement } from './model';

import { appName } from '../bootstrap.fun';
import { logger } from '../logger';


@Controller("broker")
export class BrokerController {

    services: Record<string, ServiceAnouncement> = {};


    @EventHandler('service/announcement')
    recieveServiceAnouncement(@Message() msg: IncomingMessage<ServiceAnouncement>) {

        const anouncement = msg.payload

        if (!this.services[anouncement.name])
            this.services[anouncement.name] = anouncement

        if (appName === anouncement.name) return // do not announce to self

        //notify commands conflicts
        const selfService = this.services[appName]
        if (anouncement.commands?.length && selfService) {
            const intersection = anouncement.commands.filter(c => selfService.commands.includes(c))
            if (intersection.length) {
                logger.warn(`Duplicate command hander ${anouncement.name}`, intersection)
            }
        }
    }

}
