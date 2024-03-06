
import { Notification, NotificationOptions } from "./notification"
import { Recipient } from "./recipient"

export type NotificationChannel<N extends Notification = Notification> = {
    readonly name: string
    readonly type: string

    /**
     * A recipient must have all the fields stated in this array. If not passed the notification service will try to read the required field from the data base using data inflation.
     * @example: ['email']
     */
    readonly requiredFields?: string[]

    /**
     * Same as requiredFields but will not fail the notification send if fields weren't passed or fetched using data inflation
     */
    readonly optionalFields?: string[]

    validate(message: N): undefined | Record<string, unknown>
    send(notification: N, channelOptions: ChannelOptions, options: NotificationOptions): Promise<DeliveryReport>
}


export type ChannelOptions = Record<string, unknown>
export type ChannelsOptions = {
    [channelNameOrType: string]: Record<string, ChannelOptions>
}

export type DeliveryReport = {
    sent: { recipient: Recipient, date: Date, meta?: any }[]
    notSent: { recipient: Recipient, date: Date, error?: any, meta?: any }[]
    received?: { recipient: Recipient, date: Date, meta?: any }[]
}