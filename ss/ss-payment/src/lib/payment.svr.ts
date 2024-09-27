import { TransactionProcessResult } from "./payment.providers/_base"
import { PaymentConfig } from "./payment.config"
import { PaymentJobProcessor } from "./payment.job-processor"
import { HttpException, HttpStatus, Injectable } from "@nestjs/common"

import { ModuleRef } from "@nestjs/core"
import { Observable } from "rxjs"

import transactionSchema, { Log, Transaction, TransactionDocument, TransactionStatus } from "./transaction.schema"
import mongoose from "mongoose"
import { handlePaymentResult } from "./handle-payment-result.fun"
import { Principle } from "@noah-ark/common"
import { Broker } from "@ss/common"
import { DataService } from "@ss/data"
import { JobScheduler } from "@ss/job"

const TRANSACTION = 'transaction'

@Injectable()
export class PaymentService {

    constructor(public paymentConfig: PaymentConfig,
        public ds: DataService,
        public broker: Broker,
        public injector: ModuleRef,
        public schedular: JobScheduler) {
          setTimeout(() => {
              this.init()
              
          }, 200);  
    }

    async init(): Promise<void> {


        for (const paymentOption of this.paymentConfig.paymentOptions) {
            const jobName = `PAYMENT-${paymentOption.type}:${paymentOption.method}`
            const paymentProvider = await this.injector.resolve(paymentOption.provider)
            const paymentProcessor = new PaymentJobProcessor(this.ds, paymentProvider, paymentOption.currencies)
            this.schedular.addProcessors(jobName, paymentProcessor)
        }
    }

    async getStatus(id: string): Promise<Transaction> {

        //const id = req.params['id']
        const model = await this.ds.getModel<TransactionDocument>(TRANSACTION)
        let transaction = await model.findById(id)
        if (!transaction) throw new HttpException("", HttpStatus.NOT_FOUND)


        /// STEP 2 : QUERY FOR TRANSACTION STATE AND RETRY
        if (transaction.status != 'pending') throw new HttpException({ status: transaction.status, error: transaction.error }, HttpStatus.NOT_ACCEPTABLE) //we have a result already

        const passedTime = new Date().getTime() - transaction.dateRequested.getTime()
        const timeout = this.paymentConfig.transactionTimeout
        if (timeout === 0) return transaction //it's manual

        if (timeout > passedTime) {

            transaction = await model.findById(id)
            if (!transaction) throw new HttpException("", HttpStatus.NOT_FOUND) //transaction removed!
            return transaction

        } else {
            /// STEP 3 : TIMEOUT APPLY STATUS FAILED
            await transaction.updateOne({ $set: { status: 'failed', error: 'timeout' } })
            await this._notify(transaction)
            return transaction //transaction timeedout!
        }

    }

    private _notify(transaction: Transaction | TransactionDocument): Observable<never> {
        if ('toObject' in transaction) transaction = transaction.toObject() as Transaction
        return this.broker.emit('transaction-status-changed', transaction)
    }

    async changeState(user: Principle, id: string, requiredStatus: TransactionStatus, body: Record<string, string>): Promise<void> {

        const model = await this.ds.getModel<TransactionDocument>(TRANSACTION)
        const transaction = await model.findById(id)
        if (!transaction) throw new HttpException("", HttpStatus.NOT_FOUND)

        const log: Log = { date: new Date(), userId: user.sub, value: transaction.status }

        switch (requiredStatus) {
            case 'approved':
                {
                    const approveCode = body.approveCode
                    if (!approveCode || transaction.approveCode === approveCode) throw new HttpException({ message: 'APPROVAL_CODE_INVALID', currentStatus: transaction.status, approveCode }, HttpStatus.BAD_REQUEST)

                    transaction.dateResponded = new Date()
                    transaction.status = 'approved'
                    transaction.approveCode = approveCode
                }
                break
            case 'rejected':
                {
                    const reason = body.reason
                    if (!reason || transaction.reason === reason) throw new HttpException({ message: 'REASON_REQUIRED', currentStatus: transaction.status, reason }, HttpStatus.BAD_REQUEST)

                    transaction.dateResponded = new Date()
                    transaction.status = 'rejected'
                    transaction.reason = reason
                }
                break
            case 'canceled':
                {
                    if (transaction.status === 'paused') transaction.status = 'canceled'
                    else throw new HttpException({ message: 'ALREADY_UNDER_PROGRESS', currentStatus: transaction.status }, HttpStatus.BAD_REQUEST)
                }
                break
            case 'done':
                {
                    const confirmationCode = body.code
                    if (!confirmationCode || transaction.confirmationCode === confirmationCode)
                        throw new HttpException({ message: 'CODE_IS_REQURIED', currentStatus: transaction.status, confirmationCode }, HttpStatus.BAD_REQUEST)

                    transaction.dateProcessed = new Date()
                    transaction.status = 'done'
                    transaction.confirmationCode = confirmationCode
                }
                break
            case 'failed':
                {
                    const error = body.error
                    if (!error)
                        throw new HttpException({ message: 'ERROR_IS_REQURIED', currentStatus: transaction.status }, HttpStatus.BAD_REQUEST)

                    transaction.status = 'failed'
                    transaction.error = error
                }
                break
            case 'processing':
                if (transaction.status === 'pending') transaction.status = 'processing'
                else throw new HttpException({ message: 'ALREADY_UNDER_PROGRESS', currentStatus: transaction.status }, HttpStatus.BAD_REQUEST)
                break
            default:
                throw new HttpException({ message: 'INVALID_STATUS', currentStatus: transaction.status }, HttpStatus.BAD_REQUEST)

        }

        //REMOVE LINKED FIELDS
        if (transaction.status != 'failed') transaction.error = undefined
        if (transaction.status != 'rejected') transaction.reason = undefined
        if (transaction.status != 'approved') transaction.approveCode = undefined
        if (transaction.status != 'done') transaction.confirmationCode = undefined

        if (transaction.logs === null) transaction.logs = []
        if (transaction.error) log.error = transaction.error
        if (transaction.reason) log.reason = transaction.reason
        if (transaction.confirmationCode) log.confirmationCode = transaction.confirmationCode
        transaction.logs.push(log)
        await transaction.updateOne()
        await this._notify(transaction)
    }



    validate(data: Transaction): Record<string, any> {
        const err = {} as Record<string, any>
        let hasError = false

        if (!data) { err.MISSING_DATA = 'MISSING_DATA'; hasError = true }
        if (!data.type || data.error) { err.INVALID_DATA = "INVALID_DATA"; hasError = true }
        if (data.net != null) { err.INVALID_NET = 'INVALID_NET'; hasError = true }
        if (!data.method) { err.INVALID_METHOD = 'INVALID_METHOD'; hasError = true }
        if (isNaN(data.amount) || data.amount < 0) { err.AMOUNT_MUST_BE_POSITIVE_NUMBER = "AMOUNT_MUST_BE_POSITIVE_NUMBER!"; hasError = true }

        if (hasError) return err
    }




    async create(user: any, transaction: Transaction, extra: any): Promise<TransactionProcessResult> {

        transaction._id = transaction._id ? new mongoose.Types.ObjectId(transaction._id) : new mongoose.Types.ObjectId() //db will check _id unique
        transaction.dateRequested = new Date()
        transaction.userId = user.sub
        transaction.type = transaction.type ?? 'transferin'
        transaction.status = 'pending'
        transaction = { ...transaction, ...extra }
        transaction.redacted = false

        transaction.net = transaction.amount
        transaction.fees = 0

        const timeout = this.paymentConfig.transactionTimeout
        if (timeout) transaction.dateOfExpiry = new Date(transaction.dateRequested.getTime() + timeout) //this will make it easy for backround jobs to clean

        const model = await this.ds.getModel<TransactionDocument>(TRANSACTION)
        const tx : any = await model.create(transaction)

        const { method, type, currency, _id } = tx
        const job = await this.schedular.run<TransactionProcessResult>(`PAYMENT-${type}:${method}`,
            { method, type, currency, _id },
            { timeout: 15000, delay: tx.paymentInfo?.delay ?? 0, backoff: 30 * 1000 }
        )

        const processResult = await job.finished() as TransactionProcessResult
        return await handlePaymentResult(tx, processResult)
    }




}

