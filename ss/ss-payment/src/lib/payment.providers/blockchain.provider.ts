import { Injectable } from "@nestjs/common"
import { Transaction, TransactionDocument } from "../transaction.schema"
import { PaymentProvider } from "../model"
import { TransactionProcessResult } from "./_base"
import { blockchain } from "../blockchain-core/_blockchain.function"
import web3 from "web3"
import { TransactionInfo } from "../payment.job-processor"
import { handlePaymentResult } from "../handle-payment-result.fun"
import { DataService } from "@ss/data"
import { JobScheduler } from "@ss/job"
import { Broker } from "@ss/common"
import { CurrencyInfo } from "../blockchain-core/_blockchain.base"
import { EtherUnits } from "web3-utils"

export class CryptoGatewayConfig {
    networks: {
        [network: string]: {
            defaultMerchantAddress: string
            scannerApiKey: string
            currencies: {
                currency: string
                contract: string
                merchantAddress?: string[]
            }[]
        }
    } = {}
}

export type CryptoPaymentInfo = {
    currency: string
    network: string
    sender: string
    merchantAddress: string
}

export const CRYPTO_METHOD = 'crypto'


@Injectable()
export class CryptoGateway implements PaymentProvider {

    merchants: { currency: string, address: string, available: boolean }[] = []
    private static _count = 0

    constructor(public config: CryptoGatewayConfig, public data: DataService, public scheduler: JobScheduler, public broker: Broker) {
        CryptoGateway._count++

        Object.values(config.networks).forEach(x => x.currencies.forEach(y => {
            y.merchantAddress.forEach(m => this.merchants.push({ currency: y.currency, address: m, available: true }))
        }))
        //add a cron job to automatically process transactions with status 'processing'

        this.scheduler.createQueue('transaction.processing', async () => {
            const model = await this.data.getModel<TransactionDocument>('transaction')
            const transactions = await model.find({ method: CRYPTO_METHOD })
            for (const transaction of transactions) {
                try {
                    const processResult = await this.process(transaction)
                    switch (processResult.status) {
                        case 'success':
                        case 'fail':
                        case 'pending':
                            await handlePaymentResult(transaction, processResult)
                            continue
                    }

                    //todo check if transaction is expired and move it to failed status
                }
                catch (error) {
                    //todo count number of fails for transaction
                }
            }
        })
            .add({}, {
                jobId: `CryptoGateway-${CryptoGateway._count}`,
                repeat: { every: 1000 * 10 },
                removeOnComplete: true,
                removeOnFail: true
            })
    }

    timeout(): number { return 15 * 1000; } //15 mins

    async process(payload: TransactionInfo): Promise<TransactionProcessResult> {

        const model = await this.data.getModel('transaction')
        const transaction: Transaction = await model.findOne({ _id: payload._id }).lean()
        const transactionId = typeof transaction._id === 'string' ? transaction._id : transaction._id.toHexString()
        if (transaction.status === 'pending') {
            if (!this.getAvailableMerchant(transaction)) return
            // await model.updateOne({_id: transaction.id},transaction)
            this.data.put(`transaction/${transaction._id}`, transaction, null)
            this._notify(transaction)
            return
        }
        if (transaction.status !== 'processing') return { transactionId, status: 'pending' }

        const { network, currency, merchantAddress } = transaction.paymentInfo as CryptoPaymentInfo
        if (!network || !this.config.networks[network]) throw new Error(`No network ${network}`)

        const currencies = this.config.networks[network].currencies.map(c => c.currency)
        if (!currencies.includes(currency)) throw new Error(`Currency ${currency} is not supported on network ${network}`)

        if (!merchantAddress) throw new Error(`No merchant address for network ${network} and currency ${currency}`)

        const knownCurrencies: { [currency: string]: CurrencyInfo } = {}

        this.config.networks[network].currencies.forEach(currency => {
            knownCurrencies[currency.currency] = { address: currency.contract, std: 'ERC20' }
        })


        const chain = await blockchain(network, { scannerApiKey: this.config.networks[network].scannerApiKey, knownCurrencies })
        await chain.connect()
        const chainActivity = await chain.getTransactions(merchantAddress, { currencies: [currency] })

        const wei = +web3.utils.toWei(transaction.amount + '', currency as unknown as EtherUnits)
        const receivedTransactions = chainActivity.filter(tx =>
            // tx.timeStamp > transaction.dateRequested.getTime() && //transaction is newer than requested
            tx.confirmations > 10 && //transaction is confirmed
            // tx.from === sender.toLowerCase() && //transaction is from the sender
            tx.value === wei) //transaction is for the same amount



        if (receivedTransactions.length === 0) return { status: "retry", transactionId }
        else {
            const transactionModel = await this.data.getModel('transaction')
            for (const tx of receivedTransactions) {

                const registeredTxNo = await transactionModel.countDocuments({ confirmationCode: tx.txID })
                if (registeredTxNo != 0) continue
                this.merchants.find(x => x.address === transaction.paymentInfo.merchantAddress).available = true
                this.broker.emit('transaction-success', { transactionId })
                return {
                    status: "success",
                    transactionId,
                    confirmationCode: tx.txID
                }
            }
        }
    }

    getAvailableMerchant(transaction: Transaction) {
        const merchants = this.merchants.filter(x => x.currency === transaction.currency && x.available)
        if (!merchants.length) return
        transaction.paymentInfo.merchantAddress = merchants[0].address
        this.merchants.find(x => x.address === merchants[0].address).available = false
        transaction.status = 'processing'
        return true
    }
    private _notify(transaction: Transaction) {
        this.broker.emit('transaction-processing', { paymentInfo: transaction.paymentInfo, userId: transaction.userId, price: transaction.net })
    }
    fees(transaction: Transaction): number {
        return 0;
    }
}
