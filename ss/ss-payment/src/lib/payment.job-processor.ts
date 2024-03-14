
import { DataService } from "@ss/data";
import { JobPriority, JobProcessor } from "@ss/job";
import { Job } from "bull";
import { PaymentProvider } from "./model";
import { TransactionProcessResult } from "./payment.providers/_base";
import { Transaction } from "./transaction.schema";

export type TransactionInfo = Pick<Transaction, '_id' | 'currency' | 'method' | 'type'>
export class PaymentJobProcessor implements JobProcessor<TransactionInfo, TransactionProcessResult>{

    name: string
    constructor(public readonly data: DataService, public readonly provider: PaymentProvider, public readonly currencies?: string[]) {
        if (!provider) throw new Error('PROVIDER_IS_REQUIRED')
    }
    async canProcess(payload: TransactionInfo): Promise<JobPriority> {
        if (!this.currencies || !this.currencies.length || this.currencies.some(c => payload.currency === c)) {
            const model = await this.data.getModel('transaction')
            const transaction = await model.findOne({ _id: payload._id }).lean()
            return -this.provider.fees(transaction as Transaction) //priority is for cheaper fees
        }
        else return false
    }

    async process(payload: TransactionInfo, job: Job): Promise<TransactionProcessResult> {
        const model = await this.data.getModel('transaction')
        const transaction = await model.findOne({ _id: payload._id })
        if (transaction.status !== 'processing') {
            const transactionId = typeof transaction._id === 'string' ? transaction._id : transaction._id.toHexString()
            return { transactionId, status: 'pending' }
        }
        const processResult = await this.provider.process(transaction)
        if (processResult.status === 'retry') processResult.jobId = job.id
        return processResult
    }


}

