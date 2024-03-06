import { Axios } from "axios"
import { BlockchainInfo, PaymentTransaction } from "../blockchain-core/_blockchain.base"
import { BlockchainScanner, BlockchainScannerQuery } from "./blockchain-scanner"

type TransactionsResponse = {
    success: boolean
    meta: {
        at: number
        page_size: number
    },
    error?: string
    statusCode?: number
}

type NormalTransactionsResponse = TransactionsResponse & {
    data: {
        txID: string
        blockNumber: number
        block_timestamp: number
        energy_fee: number
        energy_usage: number
        energy_usage_total: number
        internal_transactions: any[]
        net_fee: number
        net_usage: number
        raw_data: {
            contract: {
                parameter: {
                    type_url: string
                    value: {
                        amount: number
                        owner_address: string
                        to_address: string
                    }
                    type: 'TransferContract'
                }
            }[]
            data: string
            expiration: number
            ref_block_bytes: string
            ref_block_hash: string
            timestamp: number
        }
        raw_data_hex: string
        ret: [{ contractRet: 'SUCCESS' | 'REVERT', fee: number }]

    }[]
    signature: string[]
}

type TRC20TransactionsResponse = TransactionsResponse & {
    data: {
        transaction_id: string
        token_info: {
            symbol: string //"PiA",
            address: string
            decimals: number
            name: string //"PiAToken"
        },
        block_timestamp: number
        from: string
        to: string
        type: string
        value: string
    }[],
    meta: {
        at: number
        page_size: number
    }
}


export class TronScanner implements BlockchainScanner {
    private base: string
    private http: Axios

    constructor(public readonly chaininfo: BlockchainInfo) {
        this.init();
    }


    init() {
        switch (this.chaininfo.blockchainName) {
            case 'TRON':
            case 'TRON/MAIN': this.base = 'https://api.trongrid.io/v1'; break;
            case 'TRON/SHASTA': this.base = 'https://api.shasta.trongrid.io/v1'; break;
            default: throw new Error(`UNSUPPORTED_BLOCKCHAIN "${this.chaininfo.blockchainName}"`)
        }

        this.http = new Axios({ transformResponse: [(data, headers) => JSON.parse(data)] })
    }

    async getTransactions(address: string, query?: BlockchainScannerQuery): Promise<PaymentTransaction[]> {
        const normalTransactions = await this._getNormalTransactions(address, query?.page ?? 1)
        let erc20Transactions = await this._getTRC20Transactions(address, query?.page ?? 1, query?.allowUnkownCurrencies ?? false)

        const result = normalTransactions.concat(erc20Transactions)
        return result.sort((a, b) => a.timeStamp - b.timeStamp)
    }

    private async _getNormalTransactions(address: string, page = 1): Promise<PaymentTransaction[]> {


        const url = `${this.base}/accounts/${address}/transactions?limit=200`
        const response = await this.http.get<NormalTransactionsResponse>(url)
        if (!response.data.success) {
            throw new Error("INVALID_TRON_RESPONSE")
        }
        return response.data.data
            .filter(tx => tx.raw_data?.contract?.[0]?.parameter?.value?.amount > 0)
            .map(tx => {
                return {
                    result: tx.ret[0].contractRet === 'SUCCESS',
                    txID: tx.txID,
                    timeStamp: +tx.raw_data.timestamp,
                    type: tx.raw_data.contract[0].parameter.value.owner_address === address ? 'out' : 'in',

                    from: tx.raw_data.contract[0].parameter.value.owner_address,
                    to: tx.raw_data.contract[0].parameter.value.to_address,
                    currency: this.chaininfo.mainCurrency,
                    value: tx.raw_data.contract[0].parameter.value.amount ?? 0,
                    tokenDecimal: 6,

                    block: {
                        blockHash: tx.raw_data.ref_block_hash,
                        blockNumber: tx.blockNumber,
                    },
                    confirmations: 10,
                    cost: {
                        energyFee: +tx.energy_fee,
                        energyUsed: +tx.energy_usage,
                        energyTotal: +tx.energy_usage_total,
                        netFee: +tx.net_fee,
                        netUsed: +tx.net_usage,
                        fee: tx.ret[0].fee,
                    },



                }
            })
    }
    private async _getTRC20Transactions(address: string, page: number, allowUnkownCurrencies: boolean): Promise<PaymentTransaction[]> {

        //const url = `${this.base}?module=account&action=tokentx&address=${address}&page=${page}&sort=asc&apikey=${this.chaininfo.scannerApiKey}`
        const url = `${this.base}/accounts/${address}/transactions/trc20?limit=200`
        const response = await this.http.get<TRC20TransactionsResponse>(url)
        if (!response.data.success) {
            throw new Error(response.data.error)
        }
        return response.data.data
            .filter(tx => {
                return allowUnkownCurrencies || !!Object.entries(this.chaininfo.knownCurrencies).find(([_, currencyInfo]) => currencyInfo.address === tx.token_info.address)
            })
            .map(tx => {
                const currencyInfo = Object.entries(this.chaininfo.knownCurrencies).find(([_, currencyInfo]) => currencyInfo.address === tx.token_info.address);
                const currency = currencyInfo ? currencyInfo[0] : `${tx.token_info.symbol} - ${tx.token_info.name} : ${tx.token_info.address}`
                return {
                    result: true,
                    txID: tx.transaction_id,
                    timeStamp: tx.block_timestamp,
                    type: tx.from === address ? 'out' : 'in',

                    from: tx.from,
                    to: tx.to,
                    currency,
                    value: +tx.value,
                    tokenDecimal: this.chaininfo.tokenDecimal,
                    confirmations: 10,
                    cost: {

                    },
                    block: {
                        // blockHash: tx.blockHash,
                        // blockNumber: +tx.blockNumber,
                    },

                }
            })

    }
}