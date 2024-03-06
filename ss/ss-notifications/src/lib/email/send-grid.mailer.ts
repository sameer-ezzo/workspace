
import { Mailer } from './mailer'
import { Axios } from "axios"
import { Injectable } from '@nestjs/common'
import * as sendGrid from '@sendgrid/mail'
import { EmailNotification } from '../notification'
import { DeliveryReport } from '../notification-channel'

type SendGridVersion = { name: string, template_id: string }
type SendGridTemplate = { name: string; versions: SendGridVersion[] }

export type SendGridConifg = {
    SENDGRID_API_KEY: string
    FROM: string | { name: string, address: string },
}

@Injectable()
export class SendGridMailer implements Mailer {

    type = 'email'

    requiredFields = ['email']


    templates() { return this._templates; }


    _templates: string[] = []
    _ids: { [template: string]: string } = {}

    private http: Axios;

    resolveTemplateId(template: string): string | undefined {
        if (!template) return undefined
        return this._ids[template]
    }


    validate(notification: EmailNotification): undefined | any {

        if (!notification) return { MISSING_ARGUMENT: 'notification' }
    }



    constructor(public readonly name: string, public readonly config: SendGridConifg) {

        this.http = new Axios({ transformResponse: [(data, headers) => JSON.parse(data)] });

    }

    private _init: Promise<void>

    async init() {

        if (this._init) return this._init


        this._init = new Promise<void>(async resolve => {

            try {

                sendGrid.setApiKey(this.config.SENDGRID_API_KEY)

                const uri = 'https://api.sendgrid.com/v3/templates?generations=dynamic'
                const body = await this.http.get(uri, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.SENDGRID_API_KEY}`
                    }
                });

                if (body.data.templates) {
                    this._templates = body.data.templates.map(t => t.name)
                    for (const template of body.data.templates) {
                        this._ids[template.name] = template.versions[0].template_id
                    }
                }

            } catch (error) {
                if (error.response) console.error('SENDGRID INIT ERROR', error.response.body)
                else console.error('SENDGRID INIT ERROR', error)
            } finally {
                resolve()
            }

        })
    }


    async send(message: EmailNotification): Promise<DeliveryReport> {

        await this.init()

        const additionalFields: any = {}
        additionalFields.template_id = this.resolveTemplateId((<any>message).templatePath)
        additionalFields.dynamic_template_data = message.payload

        const recipients = message.recipients
        const emails = recipients.map(recipient => recipient.email) //todo: check all reciepents have emails

        const msg = { ...message, ...additionalFields, to: emails, from: message.payload.from ?? this.config.FROM }
        if (message.payload) {
            msg.content = [{ type: "text/html", value: message.payload }]
            delete msg.body
        }

        const date = new Date()

        try {
            await sendGrid.send(<any>msg)
            return {
                sent: emails.map(e => ({ recipient: recipients.find(r => r.email === e), date })),
                notSent: []
            }
        } catch (error) {
            const body = error && error.response ? error.response.body : error
            console.error('send-grid-error', body)
            return {
                sent: [],
                notSent: emails.map(e => ({ recipient: recipients.find(r => r.email === e), date, error })),
            }
        }
    }
}
