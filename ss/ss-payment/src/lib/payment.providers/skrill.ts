import { Transaction, TransactionDocument } from "../transaction.schema"
import { PaymentProvider } from "../model"
import { Request, Router, Response } from "express"
import { DataService } from "@ss/data"
import { TransactionProcessResult } from "./_base"
import { post, md5 } from "@ss/common"
import { logger } from "./../logger";

import { Injectable } from "@nestjs/common"
import { PaymentService } from "../payment.svr"
import { handlePaymentResult } from "../handle-payment-result.fun"

@Injectable()
export class Skrill implements PaymentProvider {

    confirmUrl = '/pay/skrill/confirm';
    returnUrl = '/pay/skrill/return';
    cancelUrl = '/pay/skrill/cancel';

    constructor(public readonly baseUrl: string, //to let payment gateway redirect back with result (server side base link)
        public readonly fallbackUrl: string, //if user was completly redirected, this is the frontend link to fallback to
        public readonly payToEmail: string, //TotalPay Api key
        public readonly secretWord: string,
        public readonly merchantId: string,
        public readonly paymentService: PaymentService,
        public readonly data: DataService,
        public readonly router: Router) {
        router.post(this.confirmUrl, async (req, res) => this.confirm(req, res));
        router.get(this.returnUrl, async (req, res) => { this.paymenyDoneEndpoint(req, res) });
        router.get(this.cancelUrl + '/:transaction_id', async (req, res) => { this.paymentCancelEndpoint(req, res) });
    }

    timeout(): number { return 300 * 1000; } //300 seconds

    async process(transaction: Transaction): Promise<TransactionProcessResult> {
        if (transaction.method != 'skrill') throw "invalid-method";
        const user = await this.data.get(`/user/${transaction.userId}`);
        if (!user) { return { transactionId: transaction.id, status: 'fail', error: 'INVALID_USER' }; }

        const form = {
            prepare_only: 1,
            pay_from_email: user.email,
            pay_to_email: this.payToEmail,
            amount: transaction.amount,
            currency: transaction.currency,
            transaction_id: transaction.id,
            //return_url: `${this.baseUrl}${this.returnUrl}/${transaction.id}`,
            cancel_url: `${this.baseUrl}${this.cancelUrl}/${transaction.id}`,
            status_url: `${this.baseUrl}${this.confirmUrl}`
        };

        try {
            const sessionId = await post('https://pay.skrill.com', { form });
            return { transactionId: transaction.id, status: 'redirect', url: `https://pay.skrill.com/?sid=${sessionId}` };
        }
        catch (err) {
            console.error('SKRILL', err);
            return { transactionId: transaction.id, status: 'fail', error: err + '' };
        }
    }


    async confirm(req: Request, res: Response) {


        const { transaction_id, merchant_id, md5sig, mb_amount, mb_currency, status, failed_reason_code, mb_transaction_id } = req.body;

        if (!transaction_id) { res.status(400).send({ message: 'MISSING_TRANSACTION_ID' }); return; }
        if (this.merchantId != merchant_id) { res.status(400).send({ message: 'INVALID_MERCHANT_ID' }); return; }


        const passwordHash = md5().update(this.secretWord).digest('hex').toUpperCase();
        const hash = md5().update(this.merchantId + transaction_id + passwordHash + mb_amount + mb_currency + status).digest('hex').toUpperCase();
        if (hash != md5sig) { res.status(400).send({ message: 'INVALID_SIGNATURE' }); return; }

        logger.info('SKRILL', req.body);

        const model = await this.data.getModel<Transaction>('transaction');
        const transaction = await model.findById(transaction_id);
        if (!transaction || transaction.status != 'pending') { res.status(400).send({ message: 'INVALID_TRANSACTION' }); return; }
        switch (status) {
            case '-2': //failed
                await handlePaymentResult(transaction, { status: 'fail', transactionId: transaction.id, error: failed_reason_code });
                break;
            case '2': //done
                await handlePaymentResult(transaction, { status: 'success', transactionId: transaction.id, fees: isNaN(+mb_amount) ? 0 : transaction.amount - (+mb_amount), confirmationCode: mb_transaction_id as string });
                break;
            case '0':
                await handlePaymentResult(transaction, { status: 'pending', transactionId: transaction.id });
                break;
            case '1':
                await handlePaymentResult(transaction, { status: 'fail', transactionId: transaction.id, error: 'CANCELED' });
                break;
            default:
                await handlePaymentResult(transaction, { status: 'fail', transactionId: transaction.id, error: { msg: 'UNKOWN_STATUS', status } });
                break;
        }

        res.send('');

    }
    fees(transaction: Transaction): number {
        return 0;
    }
    async paymentCancelEndpoint(req: Request, res: Response) {

        const { transaction_id } = req.params;
        if (!transaction_id) { res.status(400).send({ message: "INVALI_QUERY_PARAMS" }); return; }

        const model = await this.data.getModel<Transaction>('transaction');
        const transaction = await model.findById(transaction_id);
        if (!transaction || transaction.status != 'pending') { res.status(400).send({ message: 'INVALID_TRANSACTION' }); return; }

        await handlePaymentResult(transaction, { status: 'fail', transactionId: transaction.id, error: 'CANCELED' });

        res.send(this.html('canceled', transaction));

    }

    async paymenyDoneEndpoint(req: Request, res: Response) {

        const { transaction_id, msid } = req.query as any;
        if (!transaction_id || !msid) { res.status(400).send({ message: "INVALI_QUERY_PARAMS" }); return; }

        const secretHash = md5().update(this.secretWord).digest('hex').toUpperCase();
        const hash = md5().update(this.merchantId + transaction_id + secretHash).digest('hex').toUpperCase();
        if (hash != msid.toUpperCase()) { res.status(400).send({ message: 'INVALID_SIGNATURE' }); return; }

        const model = await this.data.getModel<TransactionDocument>('transaction');
        const transaction = await model.findById(transaction_id);
        if (!transaction || transaction.status != 'pending') { res.status(400).send({ message: 'INVALID_TRANSACTION' }); return; }


        await handlePaymentResult(transaction, { transactionId: transaction.id, status: 'success', fees: 0, confirmationCode: '' })

        res.send(this.html('done', transaction));

    }

    //this page is displayed if users got redirected completly here
    html(status: string, transaction: TransactionDocument) {
        const fallback = `${this.fallbackUrl}?transaction=${transaction.id}`;
        return `<html>
    <head><title>Payment | Redirect</title></head>
    <body onload="document.location.href='${fallback}'">
        <p>${status}</p>
        <p>If your browser does not support javascrip redirect please click <a href="${fallback}">here</a></p>
    </body>
    </html>`;
    }
}
