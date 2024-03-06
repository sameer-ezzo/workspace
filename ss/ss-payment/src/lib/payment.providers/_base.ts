export type TransactionProcessResult = { transactionId: string,merchantaddress?:string, fees?: number } & (RedirectResult | HtmlResult | PendingResult | SuccessResult | FailResult | RetryResult);
type RedirectResult = { status: 'redirect'; url: string; }
type HtmlResult = { status: 'html'; html: string; }
type SuccessResult = { status: 'success', confirmationCode: string }
type PendingResult = { status: 'pending' }
type FailResult = { status: 'fail', error: any }
type RetryResult = { status: 'retry', attempts?: number, jobId?: number | string }


import { Transaction } from "../transaction.schema";
import { PaymentProvider } from "../model";
import { Injectable } from "@nestjs/common";


@Injectable()
export class ManualPaymentProvider implements PaymentProvider {

    timeout(): number { return 0 }
    async process(transaction: Transaction): Promise<TransactionProcessResult> {
        return { status: 'pending', transactionId: transaction.id }
    }
    async redact(transaction: Transaction): Promise<void> {
        transaction.redacted = true;
        await transaction.save();
    }
    fees(transaction: Transaction): number {
        return 0;
    }
}
