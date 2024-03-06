import { Twilio } from 'twilio'
import { Injectable } from '@nestjs/common'

import * as Path from 'path'
import { walkSync } from "@ss/common"
import { logger } from "./../logger";

import * as fs from 'fs'
import * as handlebars from 'handlebars'
import { SmsNotification } from '../notification'
import { DeliveryReport, NotificationChannel } from '../notification-channel'
import { User } from '@noah-ark/common';

@Injectable()
export class TwilioSmsGateway implements NotificationChannel {

    constructor(public readonly name = "twilio", public readonly TEMPLATE_BASE: string = "./") { }


    validate(notification: SmsNotification): undefined | any {
        if (!notification) return { MISSING_ARGUMENT: 'notification' }
    }

    templates(): string[] {
        return walkSync(this.TEMPLATE_BASE, file => file.endsWith('.hbs'))
            .map(fullPath => fullPath.substring(this.TEMPLATE_BASE.length + 1))
            .map(path => path.substring(0, path.length - Path.extname(path).length))
    }
    getTemplate(source: string, data: any) {
        const template = handlebars.compile(source)
        return template(data)
    }

    twilio: Twilio
    from: string
    readonly type = 'sms'
    readonly requiredFields = ['phone']



    // async init(phonerInfo: PhonerInfo) {
    //     this.name = phonerInfo.name;
    //     Object.freeze(this.name)

    //     this.config = phonerInfo.config;

    //     this.twilio = new Twilio(this.config.TWILIO_ID, this.config.TWILIO_TOKEN);
    //     this.from = typeof this.config.FROM === 'string' ? this.config.FROM : this.config.FROM?.number;
    // }

    private async renderHtmlFromFile(template: string, data: any) {

        const templatePath = Path.join(this.TEMPLATE_BASE, `${template}.hbs`)
        if (!fs.existsSync(templatePath)) throw new Error("File not found!. " + templatePath)

        const htmlText = await fs.promises.readFile(templatePath, 'utf-8')
        return this.getTemplate(htmlText, data)
    }

    send(message: SmsNotification): Promise<DeliveryReport> {
        return this.sendAsync(message)
    }

    async sendAsync(message: SmsNotification): Promise<DeliveryReport> {
        const recipients = message.recipients
        const tasks = recipients.map(r => this._send(message, r, message.payload.template, message.payload))
        const sentTo = await Promise.allSettled(tasks).then(results => results
            .filter(r => r.status === 'fulfilled')
            .map(r => r['value'] as string))

        return {
            sent: sentTo.map(phone => ({ recipient: message.recipients.find(r => r.phone === phone), date: new Date() })),
            notSent: []
        }
    }

    private async _send(message: SmsNotification,
        recipient: Partial<User> & Pick<User, "_id"> & Record<string, unknown>,
        template?: string, data = {}): Promise<string> {
        const body = await this.renderHtmlFromFile(template ?? message['template'],
            {
                ...message,
                ...data,
                recipients: [recipient]
            })
        const msg = { ...message, ...{ from: message.payload.from ?? this.from }, to: recipient.phone, body }

        try {
            await this.twilio.messages.create(msg)
            return recipient.phone
        } catch (error) {
            logger.info(error)
        }
    }
}
