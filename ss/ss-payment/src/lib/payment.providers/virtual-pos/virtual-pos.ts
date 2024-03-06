const jsonToXml = require('fast-xml-parser').j2xParser
import { PaymentCard, PaymentProvider } from "../../model"
import { Currency, currencies } from "../../currencies"
import { Transaction } from "../../transaction.schema"
import { TransactionProcessResult } from "../_base"
import { Injectable } from "@nestjs/common"
const crypto = require('crypto')
import { Axios } from "axios"
import { logger } from "./../../logger";

export type VirtualPosConfig = {
    payUrl: string,
    approveUrl: string,
    payObjectWrapper: string,
    approveObjectWrapper: string,
    merchantId: string,
    customerId: string,
    username: string,
    password: string,
    okUrl: string,
    failUrl: string
}

//TODO save transaction status on db
@Injectable()
export class VirtualPos implements PaymentProvider {

    private http: Axios

    payObjectWrapper: string
    payObjectStructure = {
        "APIVersion": "APIVersion",
        "OkUrl": "OkUrl",
        "FailUrl": "FailUrl",
        "HashData": "HashData",
        "MerchantId": "MerchantId",
        "CustomerId": "CustomerId",
        "UserName": "UserName",
        "Password": "Password",
        "CardNumber": "CardNumber",
        "CardExpireDateYear": "CardExpireDateYear",
        "CardExpireDateMonth": "CardExpireDateMonth",
        "CardCVV2": "CardCVV2",
        "CardHolderName": "CardHolderName",
        "CardType": "CardType",
        "BatchID": "BatchID",
        "TransactionType": "TransactionType",
        "InstallmentCount": "InstallmentCount",
        "Amount": "Amount",
        "DisplayAmount": "DisplayAmount",
        "CurrencyCode": "CurrencyCode",
        "MerchantOrderId": "MerchantOrderId",
        "TransactionSecurity": "TransactionSecurity"
    }
    payObjectDefaults: { [key: string]: string } = {
        "APIVersion": "1.0.0",
        "OkUrl": "",
        "FailUrl": "",
        "MerchantId": "0",
        "CustomerId": "0",
        "UserName": "",
        "BatchID": "0",
        "TransactionType": "Sale",
        "TransactionSecurity": "3"
    }

    approveObjectWrapper: string = ''
    approveObjectStructure = {
        "APIVersion": "APIVersion",
        "OkUrl": "OkUrl",
        "FailUrl": "FailUrl",
        "HashData": "HashData",
        "MerchantId": "MerchantId",
        "CustomerId": "CustomerId",
        "UserName": "UserName",
        "CardNumber": "CardNumber",
        "CardExpireDateYear": "CardExpireDateYear",
        "CardExpireDateMonth": "CardExpireDateMonth",
        "CardCVV2": "CardCVV2",
        "CardHolderName": "CardHolderName",
        "CardType": "CardType",
        "BatchID": "BatchID",
        "TransactionType": "TransactionType",
        "InstallmentCount": "InstallmentCount",
        "Amount": "Amount",
        "DisplayAmount": "DisplayAmount.00",
        "CurrencyCode": "CurrencyCode",
        "MerchantOrderId": "MerchantOrderId",
        "TransactionSecurity": "TransactionSecurity",
        "AdditionalData": "AdditionalData"
    }
    approveObjectDefaults: { [key: string]: string | object } = {
        "APIVersion": "1.0.0",
        "TransactionType": "Sale",
        "TransactionSecurity": "3",
        "AdditionalData": {
            "AdditionalDataList": {
                "VPosAdditionalData": {
                    "Key": "MD",
                }
            }
        }
    }

    constructor(public name: string, private config: VirtualPosConfig) {
        this.payObjectWrapper = config.payObjectWrapper
        this.payObjectDefaults.MerchantId = config.merchantId
        this.payObjectDefaults.CustomerId = config.customerId
        this.payObjectDefaults.UserName = config.username
        this.approveObjectDefaults.Password = config.password
        this.payObjectDefaults.OkUrl = config.okUrl
        this.payObjectDefaults.FailUrl = config.failUrl

        this.http = new Axios({
            transformResponse: [(data, headers) => JSON.parse(data)]
        })
    }
    fees(transaction: Transaction): number {
        return 0
    }
    timeout(): number { return 300 * 1000 }

    async process(transaction: Transaction): Promise<TransactionProcessResult> {

        if (transaction.method != 'card' || !transaction.paymentInfo) throw "INVALID_METHOD"
        const card = PaymentCard.extract(transaction.paymentInfo)
        if (!card) throw "INVALID_METHOD"


        let payObjectMessage: any = {}
        const structure: any = this.payObjectStructure
        Object.keys(structure).forEach(k => { //construct pay-object with defaults
            const property = structure[k]
            payObjectMessage[property] = this.payObjectDefaults[k]
        })

        //fill out transaction data
        payObjectMessage = Object.assign({}, payObjectMessage, {
            [this.payObjectStructure.MerchantOrderId]: transaction.id,

            [this.payObjectStructure.CardNumber]: card.cardNumber,
            [this.payObjectStructure.CardExpireDateMonth]: card.expiryDateMonth,
            [this.payObjectStructure.CardExpireDateYear]: card.expiryDateYear,
            [this.payObjectStructure.CardCVV2]: card.cardCVV2,
            [this.payObjectStructure.CardHolderName]: card.cardHolderName,
            [this.payObjectStructure.CardType]: card.cardType,

            [this.payObjectStructure.InstallmentCount]: transaction.installments || 0,
            [this.payObjectStructure.Amount]: transaction.amount,
            [this.payObjectStructure.DisplayAmount]: transaction.amount.toString(),
            [this.payObjectStructure.CurrencyCode]: transaction.currencies[transaction.currency].numeric,
        })

        payObjectMessage[this.payObjectStructure.HashData] = this._hashPayment(payObjectMessage)

        const body = `<${this.payObjectWrapper} xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
         ${Object.keys(this.approveObjectStructure).map(k => `<${k}>${this.approveObjectDefaults[k] ? this.approveObjectDefaults[k] : payObjectMessage[k]}</${k}>`)}
         </${this.payObjectWrapper}>`
        
         
        const response = await this.http.post(this.config.payUrl, {
            headers: { 'Content-Type': 'application/xml' },
            body: Buffer.from(body, 'utf8')
        })
        return response.data
    }

    async approvePayment(orderId: string, md: string, amount: number, currency: Currency, installments = 0) {
        let approveObject: any = {}
        const structure: any = this.approveObjectStructure
        Object.keys(structure).forEach(k => { //construct pay-object with defaults
            const property = structure[k]
            approveObject[property] = this.approveObjectDefaults[k]
        })

        approveObject[this.approveObjectStructure.MerchantOrderId] = orderId

        approveObject[this.approveObjectStructure.Amount] = amount
        approveObject[this.approveObjectStructure.DisplayAmount] = amount
        approveObject[this.approveObjectStructure.CurrencyCode] = currencies[currency].numeric
        approveObject[this.approveObjectStructure.InstallmentCount] = installments

        approveObject[this.approveObjectStructure.HashData] = this._hashApproval(approveObject)


        approveObject.AdditionalData.AdditionalDataList.VPosAdditionalData.Data = md
        approveObject.AdditionalData.AdditionalDataList.VPosAdditionalData['#text'] = 'response'

        const xml = jsonToXml.parse(approveObject)
        const body = `<${this.approveObjectWrapper} xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            ${xml}
        </${this.approveObjectWrapper}>`
        const response = await this.http.post(this.config.approveUrl, { headers: { 'Content-Type': 'application/xml' }, body })
        return response.data
    }

    protected _hashPayment(message: any): any {
        const amount = Number(message.Amount) * 100 // this is due to bank instruction so each 1 TL equal 100 in the bank system.

        const password = crypto.createHash('sha1').update(Buffer.from(message.Password).toString('utf8')).digest()
        const HashedPassword = Buffer.from(password).toString('base64')
        const hashstr = `${message.CustomerId}${message.MerchantId}${amount}${message.OkUrl}${message.FailUrl}${message.UserName}${HashedPassword}`
        const hashbytes = Buffer.from(hashstr, 'utf-8')
        const inputbytes = Buffer.from(crypto.createHash('sha1').update(hashbytes).digest())
        return Buffer.from(inputbytes.toString(), 'base64')

    }

    protected _hashApproval(message: any): any {
        const amount = Number(message.totalAmount) * 100 // this is due to bank instruction so each 1 TL equal 100 in the bank system.

        const password = crypto.createHash('sha1').update(Buffer.from(message.Password).toString('utf8')).digest()
        const HashedPassword = Buffer.from(password).toString('base64')
        const hashstr = `${message.CustomerId}${message.MerchantId}${amount}${message.OkUrl}${message.FailUrl}${message.UserName}${HashedPassword}`
        const hashbytes = Buffer.from(hashstr, 'utf-8')
        const inputbytes = Buffer.from(crypto.createHash('sha1').update(hashbytes).digest())
        const HashData = new Buffer(inputbytes.toString(), 'base64')



        const postdata = `<${this.approveObjectWrapper} xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
         ${Object.keys(this.approveObjectStructure).map(k => `<${k}>${this.approveObjectDefaults[k] ? this.approveObjectDefaults[k] : message[k]}</${k}>`)}
         </${this.payObjectWrapper}>`

        return Buffer.from(postdata, 'utf8')

    }

    async redact(transaction: Transaction): Promise<void> {
        const card = PaymentCard.extract(transaction.paymentInfo)
        if (card) {
            transaction.dateProcessed = new Date()
            transaction.redacted = true
            transaction.set('paymentInfo', { number: card.cardNumber.substring(card.cardNumber.length - 4) })
            await transaction.save()
        }
    }
}

