import { Injectable } from "@nestjs/common";
import { DeliveryReport, NotificationChannel } from "../notification-channel";
import { Notification } from "../notification";
import { WebsocketsGateway } from "@ss/common";

// export type PushNotification = Notification<Record<string, unknown>, { devices?: UserDevice<PushSubscription>[] }>

@Injectable()
export class WebsocketChannel implements NotificationChannel {
    readonly type = "ws"
    requiredFields = ["_id", "devices"]

    constructor(
        public readonly name: string = "ws",
        public readonly ws: WebsocketsGateway
    ) { }

    validate(notification: Notification): undefined | Record<string, unknown> {
        if (!notification) return { MISSING_ARGUMENT: "notification" };
        return undefined;
    }

    send(notification: Notification): Promise<DeliveryReport> {
        return this.sendAsync(notification);
    }

    async sendAsync(notification: Notification): Promise<DeliveryReport> {
        const tasks = notification.recipients
            .filter(recipient => recipient._id && recipient.devices)
            .map(async (recipient) => {
                const recipientSockets = await this.ws.room(recipient._id!)
                const devicesSockets = recipientSockets.filter(s => {
                    const did = s.handshake.query.device as string
                    return !!recipient.devices?.[did]
                })

                const acks = await this.ws.toSockets(devicesSockets, `notification:${notification.topic}`, notification)
                return { recipient, acks }
            })
        //if same device has more than 1 socket then is it delivered to device or not ?

        const response = await Promise.all(tasks)
        const date = new Date()

        const report = {
            sent: [],
            notSent: [],
        } as DeliveryReport

        for (const res of response) {

            const { recipient, acks } = res

            const deliveredDevices: Record<string, boolean> = {}
            const notDeliveredDevices: Record<string, boolean> = {}
            for (const a of acks) {
                const did = a.socket.handshake.query.device as string
                if (a.error) notDeliveredDevices[did] = true
                else deliveredDevices[did] = true
            }

            const devices = Object.keys(deliveredDevices)

            if (acks.length == 0) report.notSent.push({ recipient, date, error: 'DEVICES_NOT_ONLINE' }) //either no devices/sockets or not acks
            else if (Object.keys(notDeliveredDevices).length) {
                const entries = Object.entries(recipient.devices ?? {}).filter(([k]) => deliveredDevices[k])
                recipient.devices = Object.fromEntries(entries)
                report.notSent.push({ recipient, date, error: 'DOME_DEVICES_HAVE_NOT_RECEIVED', meta: { devices } })
            }
            else { //notification delivered to some or all devices
                report.sent.push({ recipient, date, meta: { devices } })
            }
        }
        return report
    }
}