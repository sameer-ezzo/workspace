import { DeliveryReport } from "./notification-channel"
import { Recipient } from "./recipient"

export type ChannelType = 'email' | 'sms' | 'push' | 'ws' | string
export type NotificationTag = string



export type NotificationPayload = { templatePath?: string } | { template?: string } | { body?: string }



export type Notification<TData = unknown, TRecipient = Record<string, unknown>> = NotificationPayload & {
    /**
     * @description  The notification ref is used to hint the channel not to send the same notification to the same recipient (avoid double notification).
     * This is not to be confused with id which is unique per database record not per recipient delivery.
     */
    ref?: string

    topic: string

    recipients: (Recipient & TRecipient)[]


    /**
    * @description  It's recommended to tag notification to allow users to opt out or in to notifications.
    * @example Promotional, Alert, Social
    */
    tags?: NotificationTag[]

    /**
     * @description  Extra data object that will be passed to template engine and the channel.
     */
    payload?: TData

    /**
     * @description  Report will be filled in by the Notification Service and Channels
     */
    report?: {
        summary?: { [recipient: string]: boolean }
        delivery: { [K in keyof DeliveryReport]: (DeliveryReport[K][number] & { channel: string })[] }
        channel: {
            name: string
            index: number
        }
    }


    groupKey?: string
    priority?: 'critical' | 'normal'
}

export type NotificationRecord = Omit<Notification, "recipients" | "report"> & {
    recipient: string
    notificationId: string
    body: string
    channel: string
    date: Date
}


export type NotificationOptions = {
    store: boolean
    additionalFields?: string[]
}



export type EmailNotification = Notification<{
    from?: string | { name: string, address: string },
    subject?: string,
    Cc?: Recipient | Recipient[],
    Bcc?: Recipient | Recipient[],
}>

export type SmsNotification = Notification<{ from?: string, template?: string }>
