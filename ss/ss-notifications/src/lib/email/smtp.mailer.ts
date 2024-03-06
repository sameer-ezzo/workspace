import * as nodemailer from 'nodemailer'
import { Transporter } from 'nodemailer'
import { Mailer } from "./mailer"
import { SMTPConfig } from './smtp-config'
import * as Path from 'path'
import * as handlebars from 'handlebars'
import * as fs from 'fs'

import { walkSync } from "@ss/common"
import { EmailNotification } from '../notification'
import { DeliveryReport } from '../notification-channel'
import { Recipient } from '../recipient'

//todo: better solution: for bulk sending, current solution is sequential because of multiple jobs and transactional.
//todo: notification should have reference if a new notification were to be sent to same reference. oly the difference is applied. (prevent sending same emails to same people).

export class SmtpMailer implements Mailer {

    type = 'email'
    requiredFields = ['email']

    private transporter: Transporter;


    validate(notification: EmailNotification): undefined | any {

        if (!notification) return { MISSING_ARGUMENT: 'notification' }
    }

    constructor(public readonly name: string, public readonly config: SMTPConfig) {
        this.transporter = nodemailer.createTransport(this.getTransporterConfig(this.config))
        // this.transporter.verify((error, success) => {
        //     if (error) {
        //         logger.error(`SMTP Server @ ${this.config.SMTP_HOST}.`, { error })
        //     } else {
        //         logger.info(`SMTP Server @ ${this.config.SMTP_HOST} is ready.`)
        //     }
        // });
    }


    getTransporterConfig(config: SMTPConfig): any {
        return {
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_SECURE,
            auth: {
                user: config.SMTP_AUTH_USER,
                pass: config.SMTP_AUTH_PASS,
            }
        }
    }

    async send(message: EmailNotification): Promise<DeliveryReport> {

        const from = message?.payload.from ?? this.config.FROM
        const recipients = message.recipients
        const emails = recipients.map(recipient => recipient.email)
        const date = new Date()
        if (await this.isMessageBodyVariable(message, recipients)) {

            const tasks = recipients.map(async recipient => {
                const body = ('body' in message) ? message.body : await this.renderTemplate(message, { ...message.payload, recipient })
                const msg: any = { from, subject: message.payload.subject ?? '', to: recipient.email, body, html: body, text: body }

                return this.transporter.sendMail(msg)
            })

            await Promise.all(tasks)
        } else {

            const body = ('body' in message) ? message.body : await this.renderTemplate(message, message.payload)
            const msg: any = { from, subject: message.payload.subject ?? '', to: emails, body, html: body, text: body }

            await this.transporter.sendMail(msg)
        }

        return {
            sent: emails.map(e => ({ recipient: recipients.find(r => r.email === e), date })),
            notSent: []
        }


    }

    private async isMessageBodyVariable(message: EmailNotification, recipients: Recipient[]): Promise<boolean> {
        if (recipients.length === 1) return true
        if ('body' in message) return false

        const body1 = await this.renderTemplate(message, { ...message.payload, recipient: recipients[0] })
        const body2 = await this.renderTemplate(message, { ...message.payload, recipient: recipients[1] })

        return body1 !== body2
    }


    private renderTemplate(message: EmailNotification, data: any): Promise<string> {
        if ('templatePath' in message) return this.renderHtmlFromFile(message.templatePath, data)
        if ('template' in message) return Promise.resolve(this.getTemplate(message.template, data))
        throw new Error('template or templatePath is required')
    }




    private async renderHtmlFromFile(template: string, data: any) {

        const templatePath = Path.join(this.config.TEMPLATE_BASE, `${template}.hbs`)
        if (!fs.existsSync(templatePath)) throw new Error("File not found!. " + templatePath)

        const htmlText = await fs.promises.readFile(templatePath, 'utf-8')
        return this.getTemplate(htmlText, data)
    }

    getTemplate(source, data) {
        const template = handlebars.compile(source)
        return template(data)
    }

    templates(): string[] {
        return walkSync(this.config.TEMPLATE_BASE, file => file.endsWith('.hbs'))
            .map(fullPath => fullPath.substring(this.config.TEMPLATE_BASE.length + 1))
            .map(path => path.substring(0, path.length - Path.extname(path).length))
    }
}