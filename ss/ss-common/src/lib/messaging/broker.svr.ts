import { Inject, Optional, Injectable } from '@nestjs/common'
import type { BrokerClient } from '@noah-ark/event-bus'
import { Observable } from 'rxjs'
import { logger } from '../logger'

export const BROKER_CLIENT = 'broker_client'

@Injectable()
export class Broker {

    constructor(@Optional() @Inject(BROKER_CLIENT) public readonly client: BrokerClient) {
    }

    send(pattern: string, data: any): Observable<any> {
        logger.verbose('SENDING MESSAGE', pattern, data)
        return this.client.send(pattern, data)
    }

    emit<T = any>(pattern: string, data: T): Observable<never> {
        logger.verbose('EMMITTING MESSAGE', pattern, data)
        return this.client.emit(pattern, data)
    }
}