import { Controller } from '@nestjs/common';

import type { IncomingMessage } from '@noah-ark/common';
import { EventHandler } from './event-endpoint.decorator';
import { Message, ServiceAnouncement as ServiceAnnouncement } from './model';

import { appName } from '../bootstrap.fun';
import { logger } from '../logger';


@Controller("broker")
export class BrokerController {

    services: Record<string, ServiceAnnouncement> = {};


    @EventHandler('service/announcement')
    receiveServiceAnnouncement(@Message() msg: IncomingMessage<ServiceAnnouncement>) {

        const announcement = msg.payload!

        if (!this.services[announcement.name])
            this.services[announcement.name] = announcement

        if (appName === announcement.name) return // do not announce to self

        //notify commands conflicts
        const selfService = this.services[appName]
        if (announcement.commands?.length && selfService) {
            const intersection = announcement.commands.filter(c => selfService.commands.includes(c))
            if (intersection.length) {
                logger.warn(`Duplicate command handler ${announcement.name}`, intersection)
            }
        }
    }

}
