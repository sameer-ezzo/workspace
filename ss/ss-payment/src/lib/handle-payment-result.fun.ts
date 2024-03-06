import { TransactionProcessResult } from "./payment.providers/_base";
import { TransactionDocument } from "./transaction.schema";
import { delay } from "@noah-ark/common";

export async function handlePaymentResult(transaction: TransactionDocument, processResult: TransactionProcessResult): Promise<TransactionProcessResult> {

    let _handeled = false;
    switch (processResult.status) {
        case 'fail':
            transaction.status = 'failed';
            transaction.error = processResult.error;
            _handeled = true;
            break;
        case 'success':
            transaction.status = 'done';
            transaction.confirmationCode = processResult.confirmationCode;
            transaction.fees = processResult.fees ?? 0;
            transaction.net = transaction.amount - transaction.fees;
            _handeled = true;
            break;
        case 'retry':
            {
                const job = await this.schedular.queue.getJob(processResult.jobId);

                if (job.attemptsMade >= 20) {
                    transaction.status = 'failed';
                    transaction.error = 'MaximimAttemptsReached';
                    transaction.save();
                    throw new Error('max retries reached');
                } else {
                    const { method, type, currency, _id } = transaction;
                    await delay(8000);
                    await job.update({ method, type, currency, _id });
                    await delay(2000);
                    await job.retry();
                }
            }
            break;
    }


    if (_handeled) {
        transaction.dateProcessed = new Date();
        await transaction.save();
    }

    if (_handeled || (transaction.status === 'pending' && transaction.timeout === 0))
        await this._notify(transaction);

    return processResult;
}
