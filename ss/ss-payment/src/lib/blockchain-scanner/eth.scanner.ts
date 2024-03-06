import { Axios } from "axios"
import { BlockchainInfo, PaymentTransaction } from "../blockchain-core/_blockchain.base"
import { BlockchainScanner } from "./blockchain-scanner"

type ERC20Transaction = {
    blockNumber: string
    timeStamp: string //ms
    hash: string
    nonce: string
    blockHash: string
    from: string
    contractAddress: string
    to: string
    value: string
    tokenName: string
    tokenSymbol: string
    tokenDecimal: string
    transactionIndex: string
    gas: string
    gasPrice: string
    gasUsed: string
    cumulativeGasUsed: string
    input: string
    confirmations: string
}
type NormalTransaction = {
    blockNumber: string
    timeStamp: string
    hash: string
    nonce: string
    blockHash: string
    transactionIndex: string
    from: string
    to: string
    value: string
    gas: string
    gasPrice: string
    isError: string
    txreceipt_status: string
    input: string
    contractAddress: string
    cumulativeGasUsed: string
    gasUsed: string
    confirmations: string
}

type ScannerResponse = {
    status: "0" | "1",
    message: string
}

type GetTransactionResponse = ScannerResponse & { result: NormalTransaction[] }
type GetERC20TransactionResponse = ScannerResponse & { result: ERC20Transaction[] }

export class EthScanner implements BlockchainScanner {
    private base: string;
    private http: Axios;

    constructor(public readonly chaininfo: BlockchainInfo) {
        this.init();
    }


    init() {
        switch (this.chaininfo.blockchainName) {
            case 'BSC': this.base = 'https://api.bscscan.com/api'; break;
            case 'BSC/TESTNET': this.base = 'https://api-testnet.bscscan.com/api'; break;
            case 'ETH': this.base = 'https://api.ethscan.com/api'; break;
            default: throw new Error(`UNSUPPORTED_BLOCKCHAIN "${this.chaininfo.blockchainName}"`);
        }
        this.http = new Axios({
            transformResponse: [(data, headers) => JSON.parse(data)]
        });
    }

    async getTransactions(address: string, query?: {
        currencies: string[]
        allowUnkownCurrencies: boolean
        page: number
    }): Promise<PaymentTransaction[]> {
        const normalTransactions = await this._getNormalTransactions(address, query?.page ?? 1);
        const erc20Transactions = await this._getERC20Transactions(address, query?.page ?? 1, query?.allowUnkownCurrencies ?? false);

        const result = normalTransactions.concat(erc20Transactions);
        return result.sort((a, b) => a.timeStamp - b.timeStamp);
    }

    private async _getNormalTransactions(address: string, page = 1): Promise<PaymentTransaction[]> {
        const url = `${this.base}?module=account&action=txlist&address=${address}&page=${page}&sort=asc&apikey=${this.chaininfo.scannerApiKey}`
        const response = await this.http.get<GetTransactionResponse>(url)
        if (response.data.status === '0') {
            if (response.data.message === 'No transactions found') return [];
            else throw new Error(response.data.message);
        }
        return response.data.result
            .map(tx => {
                return {
                    result: tx.isError != '1',
                    txID: tx.hash,
                    timeStamp: +tx.timeStamp,
                    type: tx.from === address ? 'out' : 'in',

                    from: tx.from,
                    to: tx.to,
                    currency: this.chaininfo.mainCurrency,
                    value: +tx.value,
                    tokenDecimal: this.chaininfo.tokenDecimal,
                    confirmations: +tx.confirmations,

                    block: {

                        blockHash: tx.blockHash,
                        blockNumber: +tx.blockNumber,
                    },
                    cost: {
                        gas: +tx.gas,
                        gasPrice: +tx.gasPrice,
                        gasUsed: +tx.gasUsed,

                    },
                }
            })
    }
    private async _getERC20Transactions(address: string, page: number, allowUnkownCurrencies: boolean): Promise<PaymentTransaction[]> {
        const url = `${this.base}?module=account&action=tokentx&address=${address}&page=${page}&sort=asc&apikey=${this.chaininfo.scannerApiKey}`
        const response = await this.http.get<GetERC20TransactionResponse>(url)
        if (response.data.status === '0') {
            if (response.data.message === 'No transactions found') return [];
            else throw new Error(response.data.message);
        }
        return response.data.result
            .filter(tx => {
                const currencyInfo = Object.entries(this.chaininfo.knownCurrencies).find(([_, currencyInfo]) => currencyInfo.address === tx.contractAddress);
                return !!currencyInfo || allowUnkownCurrencies
            })
            .map(tx => {
                const currencyInfo = Object.entries(this.chaininfo.knownCurrencies).find(([_, currencyInfo]) => currencyInfo.address === tx.contractAddress);
                const currency = currencyInfo ? currencyInfo[0] : `${tx.tokenSymbol} - ${tx.tokenName} : ${tx.contractAddress}`
                return {
                    result: true,
                    txID: tx.hash,
                    timeStamp: +tx.timeStamp,
                    type: tx.from === address ? 'out' : 'in',

                    currency,
                    from: tx.from,
                    to: tx.to,
                    confirmations: +tx.confirmations,
                    value: +tx.value,
                    tokenDecimal: this.chaininfo.tokenDecimal,

                    block: {
                        blockHash: tx.blockHash,
                        blockNumber: +tx.blockNumber,

                    },
                    cost: {
                        gas: +tx.gas,
                        gasPrice: +tx.gasPrice,
                        gasUsed: +tx.gasUsed,
                    },
                }
            })

    }
}