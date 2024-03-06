import { Inject, Injectable, Optional } from '@nestjs/common'
import { ChannelOptions, ChannelsOptions, DeliveryReport, NotificationChannel } from './notification-channel'
import { Notification, NotificationOptions, NotificationRecord } from "./notification"
import { DataService } from '@ss/data'
import { ModuleRef } from '@nestjs/core'
import { logger } from '@ss/common'
import { ObjectId } from '@noah-ark/common'


@Injectable()
export class NotificationService {

    topics: { [topic: string]: { channels: NotificationChannel[], options?: NotificationOptions } } = {}

    channelsOptions: ChannelsOptions = {}

    private _cachedChannelsOptions: ChannelsOptions = {}
    private _cachedNotificationOptionsOptions: { [topic: string]: NotificationOptions } = {}

    constructor(public readonly injector: ModuleRef, @Inject("DB_NOTIFICATION") @Optional() public readonly data: DataService) { }

    async addChannels(topic: string, ...channels: (NotificationChannel | string)[]) {

        const _channels = await Promise.all(channels.map(x => typeof x == 'string' ? this.injector.resolve<NotificationChannel>(x) : x))

        this.topics[topic] ??= { channels: [] }
        this.topics[topic].channels.push(..._channels)

        //return this.jobScheduler.addProcessors(topic, ...channels)
    }



    /**
     * @param topic The name used in configuring notification channels. And not to be confused with template. @example 'verify-email'
     * @param notification The obj containing the actual notification data.
     * @returns
     */
    async send(notification: Notification, channelsOptions?: ChannelsOptions, notificationOptions?: NotificationOptions) {

        const topic = notification.topic

        //validate topic
        const channels = this.topics[topic]?.channels
        if (!channels?.length) throw new Error(`INVALID_TOPIC ${topic}`)


        //fill up notification
        this._fillUpDefaults(notification, channels)

        //notification options
        const options: NotificationOptions = { ...this.getNotificationOptions(topic), ...notificationOptions }

        for (let i = notification.report.channel.index; i < channels.length; i++) {
            const channel = channels[i]
            notification.report.channel = { name: channel.name, index: 0 }

            //convert simple recipients to a full recipients obj to fill out the required fields for the channel
            await this._inflateRecipients(notification, channel)

            //of the current recipients filter out those who unsubscribed from this notification tag
            await this._filterRecipients(notification, channel)

            if (!notification.recipients.length) break

            //build channel options
            channelsOptions ??= {}
            const defaultChannelOptions = this.getChannelsOptions(channel.name, channel.type)
            const channelOptions = { ...defaultChannelOptions, ...channelsOptions[channel.type], ...channelsOptions[channel.name] }

            let report: DeliveryReport
            try {
                report = await channel.send(notification, channelOptions, options)
            } catch (error) {
                //THis is extremely bad and means that some recipients have received the notification but record is lost and may spam them by sending the notification again
                //that's why we should make reporting reactive to collect as much as possible
                logger.error("INTERNAL-ERROR-IN-CHANNEL", { channel: channel.name, error })
                const date = new Date()
                report = {
                    notSent: notification.recipients.map(recipient => ({ date, recipient, error: "INTERNAL-ERROR-IN-CHANNEL" })),
                    sent: []
                }
            }

            try {
                await this._recordSendReport(notification, report, channel, i < (channels.length - 1), options)
            } catch (error) {
                logger.error("COULD NOT RECORD REPORT", error)
            }

        }


        return notification.report

    }




    private async _recordSendReport(notification: Notification, report: DeliveryReport, channel: { name: string, type: string }, nextChannel: boolean, options: NotificationOptions) {
        const sentTo = report.sent.map(x => ({ ...x, channel: channel.name }))
        const nReport = notification.report!
        nReport.delivery.sent.push(...sentTo)

        nReport.summary = {};
        nReport.delivery.sent.forEach(x => nReport.summary[x.recipient._id] = true)

        if (report.received) {
            nReport.delivery.received ??= [];
            nReport.delivery.received.push(...report.received.map(x => ({ ...x, channel: channel.name })))
        }

        if (nextChannel) notification.recipients = report.notSent.map(x => x.recipient); //try next channel for remaining recipients
        else nReport.delivery.notSent.push(...report.notSent.map(x => ({ ...x, channel: channel.name })))

        //save to db (optional)
        if (options.store || notification.ref) {
            try {
                if (!this.data) return logger.error("Data service not injected! therefore notification store feature cannot be enabled")

                const model = await this.data.getModel('notification')
                const docs = report.sent.map(r => this._toRecord(notification.topic, r.recipient._id, channel.name, notification))
                await model.insertMany(docs, { lean: true })
            } catch (error) {
                logger.error("Failed to save notification records to db", error)
            }
        }
    }

    private _toRecord(topic: string, recipient: string, channel: string, n: Notification): NotificationRecord {
        return {
            topic,
            recipient,
            notificationId: n['_id'],
            ref: n.ref,
            body: n['body'],
            payload: n.payload,
            groupKey: n.groupKey,
            priority: n.priority,
            tags: n.tags,
            channel: channel,
            date: new Date()
        }
    }

    private async _inflateRecipients(notification: Notification, channel: NotificationChannel<Notification>) {
        if (!notification.recipients?.length) return

        const requiredFields = channel.requiredFields ?? []
        const options = this.getNotificationOptions(notification.topic)
        const additionalFields = [...(channel.optionalFields ?? []), ...(options.additionalFields ?? [])]

        const { inflated, notInflated } = this.data
            ? await this.data.inflate('user', notification.recipients, requiredFields, additionalFields)
            : { inflated: [] as typeof notification.recipients, notInflated: [] as typeof notification.recipients }

        if (!this.data) {
            for (const r of notification.recipients) {
                if (channel.requiredFields.every(f => f in r)) inflated.push(r)
                else notInflated.push(r)
            }
        }

        notification.recipients = inflated;
        notification.report.delivery.notSent.push(...notInflated.map(recipient => ({ recipient, channel: channel.name, date: new Date(), error: 'deflated' })));
    }

    private _fillUpDefaults(notification: Notification, channels: NotificationChannel<Notification>[]) {
        notification['_id'] ??= ObjectId.generate()
        notification.tags ??= []
        notification.report ??= {
            summary: {},
            channel: { name: channels[0].name, index: 0 },
            delivery: { sent: [], notSent: [] }
        };
    }

    private async _filterRecipients(notification: Notification, channel: { name: string, type: string }) {

        const [accepted, unsubscribed] = [[], []]

        const tags = notification.tags ?? []
        if (notification.priority !== 'critical' && tags.length) {
            for (const r of notification.recipients) {
                const recipientsSettings = { ...r.notificationSettings, ...r.notificationSettings?.[channel.type] }
                if (!recipientsSettings.filterOut?.some(t => tags.indexOf(t) > -1))
                    accepted.push(r)
                else unsubscribed.push(r)
            }
        }
        else accepted.push(...notification.recipients)

        const report = notification.report!
        if (unsubscribed.length) {
            const notSent = unsubscribed.map(recipient => ({ recipient, channel: channel.name, date: new Date(), error: 'unsubscribed' }))
            report.delivery.notSent.push(...notSent)
        }

        //don't send to recipients who already received this reference
        if (notification.ref && accepted.length) {
            if (this.data) {
                const toBeSent = accepted.map(r => r._id).join(',')
                const alreadyReceived = await this.data.get<{ recipient: string }[]>('/notification', { select: 'recipient', ref: notification.ref, recipient: `{in}${toBeSent}` })
                for (const received of alreadyReceived) {
                    const i = accepted.findIndex(x => x._id == received.recipient)
                    const [recipient] = accepted.splice(i, 1)
                    report.delivery.notSent.push({ recipient, channel: channel.name, date: new Date(), error: 'already-sent' })
                }
            }
            else console.error("DATA_SERVICE_NOT_INJECTED")
        }

        notification.recipients = accepted
    }

    getChannelsOptions(channelName: string, channelType: string): ChannelOptions {
        this._cachedChannelsOptions[channelName] ??= { ...this.channelsOptions[channelType], ...this.channelsOptions[channelName] }
        return this._cachedChannelsOptions[channelName]
    }


    getNotificationOptions(topic: string): NotificationOptions {
        this._cachedNotificationOptionsOptions[topic] ??= { ...this.topics[topic], ...{ store: false } }
        return this._cachedNotificationOptionsOptions[topic]
    }

    // schedule(topic: string, notification: Notification, channels?: ChannelsOptions, options?: NotificationOptions) {
    //     return this.jobScheduler.run(topic, {
    //         notification,
    //         channels,
    //         options
    //     })
    // }

}
