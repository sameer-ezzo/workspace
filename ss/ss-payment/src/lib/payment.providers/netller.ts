import { Transaction } from "../transaction.schema"
import { PaymentProvider } from "../model"
import { DataService } from "@ss/data"
import { TransactionProcessResult } from "./_base"
import { post } from "@ss/common"
import { Injectable } from "@nestjs/common"
import { PaymentService } from "../payment.svr"
import { handlePaymentResult } from "../handle-payment-result.fun"

export async function netellerRedact(transaction: Transaction): Promise<void> {
    transaction.set('paymentInfo', { id: transaction.paymentInfo.id }); //remove neteller code
    transaction.redacted = true;
    await transaction.save();
}

@Injectable()
export class NetellerPaymentService implements PaymentProvider {



    constructor(
        public readonly baseUrl: string,
        public client_id: string,
        public paymentService: PaymentService,
        public client_password: string,
        public readonly data: DataService) {

    }
    timeout(): number { return 300 * 1000; }//300 seconds

    async process(transaction: Transaction): Promise<TransactionProcessResult> {
        if (transaction.method != 'neteller') throw "invalid-method";

        const neteller = transaction.paymentInfo;
        if (!neteller) throw "innvalid-neteller-data";

        const address = transaction.address;
        if (!address) throw "invalid-address";

        const user = await this.data.get(`/user/${transaction.userId}`);
        if (!user) { return { fees: 0, transactionId: transaction.id, status: 'fail', error: 'INVALID_USER' } }


        //STEP 1 AUTHORIZE
        let token = '';
        const credentials = Buffer.from(`${this.client_id}:${this.client_password}`).toString('base64');
        try {
            const authLink = 'https://api.neteller.com/v1/oauth2/token?grant_type=client_credentials';
            const authResponseStr = await post(authLink, { headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${credentials}` }, body: '' });
            const authResponse = JSON.parse(authResponseStr);
            token = authResponse.accessToken;
        }
        catch (error) {
            console.error('NETELLER', error);
            return await this.fail(transaction, 401, { message: 'INVALID_API_CREDENTIALS' });
        }


        //STEP 2 REQUEST PAYMENT
        const body = {
            paymentMethod: { type: "neteller", value: neteller.id },
            transaction: {
                merchantRefId: transaction.id,
                amount: transaction.amount.toFixed(2).replace('.', ''),
                currency: transaction.currency
            },
            verificationCode: neteller.code
        }

        try {
            const netellerResStr = await post('https://api.neteller.com/v1/transferIn', { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body });
            const netellerResult = JSON.parse(netellerResStr);

            transaction.dateProcessed = new Date();

            if (netellerResult.error) {
                return await this.fail(transaction, netellerResult.code, { message: netellerResult.message, details: netellerResult.details })
            } else {
                const processResult = { transactionId: transaction.id, status: 'success', confirmationCode: netellerResult.transaction.id } as TransactionProcessResult;
                await handlePaymentResult(transaction, processResult)
                return processResult;
            }

        } catch (err) {
            console.error('NETLLER', err);
            return await this.fail(transaction, 500, { message: err.message });
        }
    }

    fees(transaction: Transaction): number {
        return 0;
    }
    async fail(transaction: Transaction, code: any, error: { message: string } & { [key: string]: any }): Promise<TransactionProcessResult> {
        const processResult = { transactionId: transaction.id, status: 'fail', error: error.message } as TransactionProcessResult;
        await handlePaymentResult(transaction, processResult);
        return processResult;
    }

}
