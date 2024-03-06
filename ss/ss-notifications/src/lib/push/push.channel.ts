

import { Injectable } from '@nestjs/common'
import { UserDevice } from '@noah-ark/common'
import { DeliveryReport, NotificationChannel } from "../notification-channel"
import { Notification } from "../notification"
import webPush from "web-push"
import { logger } from '@ss/common'

import * as firebase from 'firebase-admin'


// eslint-disable-next-line @typescript-eslint/ban-types
export type PushNotification = Notification<{}, { devices?: UserDevice<PushSubscription>[] }>

export type PushChannelConfig = {
    webPush?: {
        VAPID_DOMAIN: string
        VAPID_PUBLIC_KEY: string
        VAPID_PRIVATE_KEY: string
    },
    firebase?: {
        projectId: string
        privateKey: string
        clientEmail: string
    }
}

const defaultConfig: PushChannelConfig = {}
if (process.env.VAPID_DOMAIN) defaultConfig.webPush = {
    VAPID_DOMAIN: process.env.VAPID_DOMAIN,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY
}
if (process.env.FIREBASE_CLIENT_EMAIL) defaultConfig.firebase = {
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID
}


@Injectable()
export class PushChannel implements NotificationChannel<PushNotification> {

    readonly type = 'push'
    requiredFields = ['devices']
    messaging = null

    /**
     *
     * @param name Channel name which will be used as an injection token
     * @param config default config are loaded prom env vars
     */
    constructor(public readonly name: string = "push", config: PushChannelConfig = defaultConfig) {

        if (config.webPush) {

            if (!config.webPush.VAPID_DOMAIN) {
                logger.error("You must set the VAPID_DOMAIN")
            }
            if (!config.webPush.VAPID_PUBLIC_KEY || !config.webPush.VAPID_PRIVATE_KEY) {
                logger.error(`You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY. You can use the following ones:`)
                logger.info(webPush.generateVAPIDKeys())
            }

            // Set the keys used for encrypting the push messages.
            webPush.setVapidDetails(
                config.webPush.VAPID_DOMAIN,
                config.webPush.VAPID_PUBLIC_KEY,
                config.webPush.VAPID_PRIVATE_KEY
            )
        }


        //firebase
        if (config.firebase) {
            if (firebase.apps.length == 0)
                firebase.initializeApp({ credential: firebase.credential.cert(config.firebase) });
            this.messaging = firebase.messaging()
        }
    }


    validate(notification: PushNotification): undefined | Record<string, unknown> {
        if (!notification) return { MISSING_ARGUMENT: 'notification' }
        return undefined
    }


    async sendNativePushNotification(token: string, title: string, body: string) {
        const message = {
            notification: {
                title: title,
                body: body
            },
            token: token
        };
        console.log('sending push notification', message)
        return this.messaging.send(message);
    }


    send(notification: PushNotification): Promise<DeliveryReport> {
        return this.sendAsync(notification)
    }

    async sendAsync(notification: PushNotification): Promise<DeliveryReport> {

        const body = notification.payload as { principle, sender, body }
        const tasks = notification.recipients.filter(r => r._id != body.sender).map(async recipient => {
            const devices = Object.values(recipient.devices)
            const pushTasks = devices.map(async device => {
                // eslint-disable-next-line no-prototype-builtins
                if (device.hasOwnProperty('pushToken')) {
                    const title = body.principle.name
                    const msg = body.body
                    const { pushToken } = device as UserDevice<any> & { pushToken: string }
                    if (pushToken) await this.sendNativePushNotification(pushToken, title, msg);
                }
                const response = await webPush.sendNotification(device.subscription, notification.payload as any, {})
                return { device, response }
            })
            const pushResults = await Promise.allSettled(pushTasks)
            return { recipient, pushResults }
        })

        const response = await Promise.all(tasks)

        const date = new Date()
        const report = {
            sent: [],
            notSent: []
        } as DeliveryReport


        for (const recipientResult of response) {

            const devices = recipientResult.pushResults
                .map(x => x.status == 'fulfilled' && x.value.response.statusCode == 201 ? x.value.device.id : undefined)
                .filter(x => x)

            if (devices.length) report.sent.push({ recipient: { _id: recipientResult.recipient._id }, date, meta: { devices } })
            else report.notSent.push({ recipient: { _id: recipientResult.recipient._id }, date })

        }

        return report
    }
}
