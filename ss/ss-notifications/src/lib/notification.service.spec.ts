import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsModule } from "./notifications.module"
import { NotificationService } from './notification.svr'
import { Notification } from "./notification"
import { WebsocketChannel } from './push/ws-channel'

class WsGatewayMock {
    async room(_room: string) {
        return [{}, {}]
    }

    async toSockets<T = any>(sockets: any[], event: string, payload: T, options = { timeout: 3000 }): Promise<{ ack: any, id: string, socket: any, error?: any }[]> {
        return [
            {
                id: '_id',
                ack: 'ack',
                socket: sockets[0],
            },
            {
                id: '_id',
                ack: undefined,
                socket: sockets[1],
                error: "ERROR"
            }
        ]
    }

}

class TestChannel extends WebsocketChannel {

    constructor(public readonly name) {
        super('test', new WsGatewayMock() as any)
    }

}


describe('Notification', () => {
    let app: TestingModule;

    beforeEach(async () => {
        app = await Test.createTestingModule({
            providers: [],
            imports: [
                NotificationsModule.register([new TestChannel("test")], { "test": { channels: ["test"] } })]
        }).compile();
    });

    describe('notification service', () => {
        it('use test mailer', async () => {
            const notificationService = await app.get<NotificationService>(NotificationService);
            const n = {
                topic: 'test',
                recipients: [{ email: 'target@example.com' }],
                body: "notification-body"
            } as Notification
            const result = await notificationService.send(n)

            console.log(result)
        });
    });

});
