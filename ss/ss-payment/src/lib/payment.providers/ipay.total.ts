import { Transaction, TransactionDocument } from "../transaction.schema";
import { PaymentCard, PaymentProvider } from "../model";
import { Request, Router, Response } from "express";
import { DataService } from "@ss/data";
import { TransactionProcessResult } from "./_base";
import { post } from "@ss/common";
import { pad } from '@noah-ark/common'
import { Injectable } from "@nestjs/common";
import { PaymentService } from "../payment.svr";
import { handlePaymentResult } from "../handle-payment-result.fun";


@Injectable()
export class iTotalPay implements PaymentProvider {

    confirmUrl = '/pay/total-pay/confirm';


    constructor(
        public readonly baseUrl: string, //to let payment gateway redirect back with result (server side base link)
        public readonly fallbackUrl: string, //if user was completly redirected, this is the frontend link to fallback to
        public readonly key: string, //TotalPay Api key
        public readonly data: DataService,
        public readonly paymentService: PaymentService,
        public readonly router: Router) {

        router.get(this.confirmUrl, async (req, res, next) => this.confirm(req, res));
    }
    fees(transaction: Transaction): number {
        return 0;
    }
    timeout(): number { return 300 * 1000; }//300 seconds

    async process(transaction: Transaction): Promise<TransactionProcessResult> {
        if (transaction.method != 'card') throw "invalid-method";

        const card = PaymentCard.extract(transaction.paymentInfo);
        if (!card) throw "innvalid-card";

        const address = transaction.address;
        if (!address) throw "invalid-address";

        const user = await this.data.get(`/user/${transaction.userId}`);
        if (!user) { return { fees: 0, transactionId: transaction.id, status: 'fail', error: 'INVALID_USER' } }

        const body = {
            api_key: this.key,
            first_name: user.firstName,
            last_name: user.lastName,

            address: address.addressLine1 || address.line1,
            country: address.country,
            state: address.state,
            city: address.city,
            zip: address.zipCode,

            ip_address: transaction.ip,

            email: user.email,
            phone_no: user.phone,

            amount: transaction.amount.toFixed(2),
            currency: transaction.currency,


            sulte_apt_no: transaction._id,
            card_no: card.cardNumber,
            ccExpiryMonth: pad(card.expiryDateMonth, 2),
            ccExpiryYear: `20${card.expiryDateYear}`,
            cvvNumber: card.cardCVV2,

            response_url: `${this.baseUrl}${this.confirmUrl}`,
            is_recurring: '0'
        }

        try {
            const ipayResultStr = await post('https://ipaytotal.solutions/api/transaction', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const ipayResult = JSON.parse(ipayResultStr);

            switch (ipayResult.status) {
                case '3d_redirect': return { fees: 0, transactionId: transaction.id, status: 'redirect', url: ipayResult.redirect_3ds_url }
                case 'fail':
                    transaction.status = 'failed';
                    transaction.error = 'server-error';
                    transaction.set('server-error', { message: ipayResult.message, errors: ipayResult.errors });
                    await transaction.save();
                    return { fees: 0, transactionId: transaction.id, status: 'fail', error: ipayResult.message };
                case 'success':
                    const processResult = { fees: 0, transactionId: transaction.id, status: 'success', confirmationCode: ipayResult.confirmationCode } as TransactionProcessResult;
                    await handlePaymentResult(transaction, processResult);
                    return processResult;
                default: return { fees: 0, transactionId: transaction.id, status: 'fail', error: `invalid-status: ${ipayResult.status}` }
            }
        } catch (err) {
            console.error('TOTAL PAY', err);
            return { fees: 0, transactionId: transaction.id, status: 'fail', error: err + '' }
        }
    }


    async confirm(req: Request, res: Response) {

        const { status, sulte_apt_no } = req.query;
        const id = sulte_apt_no;

        if (!id) { res.status(400).send({ message: 'sulte_apt_no no provided' }); return; }
        const model = await this.data.getModel<Transaction>('transaction');
        const transaction = await model.findById(id);
        if (!transaction || transaction.status != 'pending') { res.status(400).send({ message: 'INVALID_TRANSACTION' }); return; }

        switch (status) {
            case 'success':
                await handlePaymentResult(transaction, { status: 'success', transactionId: transaction.id, confirmationCode: req.query.order_id as string })
                break;
            case 'fail':
                await handlePaymentResult(transaction, { status: 'fail', transactionId: transaction.id, error: req.query.error })

                break;
            default:
                await handlePaymentResult(transaction, { status: 'fail', transactionId: transaction.id, error: { msg: "INVALID_STATUS", status } })
                break;
        }


        res.send(this.html(transaction));
    }

    //this page is displayed if users got redirected completly here
    html(transaction: TransactionDocument) {
        const fallback = `${this.fallbackUrl}?transaction=${transaction.id}`;
        //TODO if inside iframe/dialog just close it otherwise redirect to thank-you page
        return `<html>
    <head><title>Payment Success | Redirect</title></head>
    <body onload="document.location.href='${fallback}'">
        If your browser does not support javascrip redirect please click <a href="${fallback}">here</a>
    </body>
    </html>`;
    }
}




