import { Transaction } from "./transaction.schema"
import { TransactionProcessResult } from "./payment.providers/_base"

export interface PaymentProvider { //TODO any provider implementing this interface must not depend on PaymenyService
    timeout(transaction: Transaction): number
    process(transaction: Transaction): Promise<TransactionProcessResult>
    fees(transaction: Transaction): number
    redact?(transaction: Transaction): Promise<void>
}

export async function noRedact(transaction: Transaction): Promise<void> {
    transaction.redacted = true
    await transaction.save()
}

export async function paymentCardRedact(transaction: Transaction): Promise<void> {
    const card = PaymentCard.extract(transaction.paymentInfo)
    if (card && !transaction.redacted) {
        transaction.redacted = true
        if (card.cardNumber.length > 4)
            transaction.set('paymentInfo', { number: card.cardNumber.substring(card.cardNumber.length - 4) })
        await transaction.save()
    }
}

export class PaymentCard {

    static extract(body: any): PaymentCard | null {
        if (body.cardNumber) return body
        else if (body.number) return { cardType: body.type, cardNumber: body.number, expiryDateYear: body.year, expiryDateMonth: body.month, cardCVV2: body.code, cardHolderName: body.holder }
        else return null
    }

    constructor(public cardHolderName: string,
        public cardNumber: string,
        public expiryDateYear: string,
        public expiryDateMonth: string,
        public cardType: string,
        public cardCVV2: string) { }
}


// export async function notifyPayment(transaction: Transaction) { //TODO this should watch  for status change instead
//     const g = <any>global
//     try {
//         const emailService: EmailService = g.services.emailService
//         const dataServices: DataService = g.services.dataService

//         const userModel = await dataServices.getModel<UserDocument>('user')
//         const user = await userModel.findById(transaction.userId)
//         if (!user) return

//         const language = user?.language || 'ar'


//         const msg: EmailMessage = {
//             to: [user.email!],
//             bcc: transaction.method === 'local-transfer' ? [] : [adminEmail],
//             from: { email: adminEmail, name: adminName },
//             subject: 'Transaction',
//             amount: transaction.amount,
//             currency: transaction.currency,
//             template: `${transaction.type}-${transaction.status}-${language}`,
//             data: transaction
//         }


//         emailService.sendEmail(msg)

//     } catch (error) {
//         console.error('TRANSACTION_NOTIFICATION_FAILED', {
//             transaction,
//             error
//         })
//     }
// }

