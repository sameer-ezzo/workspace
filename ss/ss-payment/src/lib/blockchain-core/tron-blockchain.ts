
import { BlockchainClient, BlockchainInfo, CurrencyInfo, PaymentTransaction, Receipt } from './_blockchain.base'
import { BlockchainScannerQuery } from '../blockchain-scanner/blockchain-scanner'
import TronWeb from 'tronweb'
import { TronScanner } from '../blockchain-scanner/tron.scanner'

//DOCUMENTATION SOURCE
// TonWeb docs: https://developers.tron.network/reference/tronweb-triggersmartcontract
// Example demo: https://github.com/tronprotocol/tronweb/tree/master/demo/tron-dapp-react-demo/src
// Test address: https://shasta.tronscan.org/#/address/TXM5v5XmDb7TxH7Jav4iofd2MrAz8yhHFo/transactions

export type Tron = {
    createAccount(): Promise<{ address: { hex: string, base58: string }, privateKey: string, publicKey: string }>
    setPrivateKey(privateKey: string): void
    address: {
        fromPrivateKey(privateKey: string): Promise<string>
    }
    trx: {
        getBalance(address: string): Promise<number>
        sendTransaction(to: string, sun: number, privateKey: string)
        sign(unSignedTxn: any)
        sendRawTransaction(signedTxn: any)
    }
    contract(abi: any[], contractAddress: string): { methods: any }
    transactionBuilder: {
        addUpdateData(unSignedTxn: any, memo: string)
        triggerSmartContract(contractAddress: string, method: string, transactionInfo: { feeLimit?: number, callValue?: number, shouldPollResponse?: boolean }, inputs: { type: string, value: any }[])
    }

}


type TransactionReceipt = {
    result: boolean
    transaction:
    {
        visible: boolean
        txID: string
        raw_data:
        {
            contract: any
            ref_block_bytes: string
            ref_block_hash: string
            expiration: number
            timestamp: number
        },
        raw_data_hex: string
        signature: string[]
    }
}



//UNIT
export type Unit = 'sun' | 'trx'


function convert(val: number, from: Unit = 'sun', to: Unit = 'trx'): number {
    let sun: number
    switch (from) {
        case 'sun': sun = val; break
        case 'trx': sun = val * 1000000; break
        default: {
            const never: never = from
            throw new Error(`UNREACHABLE_CODE_EXECUTED Invalid unit '${from}'`)
        }
    }
    switch (to) {
        case 'sun': return sun
        case 'trx': return sun / 1000000
        default: {
            const never: never = to
            throw new Error(`UNREACHABLE_CODE_EXECUTED Invalid unit '${to}'`)
        }
    }
}




//IMPLEMENTATION

export class TronBlockchainClient implements BlockchainClient {


    static TRC20_ABI = [
        { "outputs": [{ "type": "uint256" }], "constant": true, "inputs": [{ "name": "who", "type": "address" }], "name": "balanceOf", "stateMutability": "View", "type": "Function" },
        { "outputs": [{ "type": "bool" }], "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "stateMutability": "Nonpayable", "type": "Function" },
        { "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "name": "value", "type": "uint256" }], "name": "Transfer", "type": "Event" }
    ]


    _scanner: TronScanner
    tronWeb: Tron

    constructor(public readonly chainInfo: BlockchainInfo) { }


    async connect() {
        const node = new TronWeb.providers.HttpProvider("https://api.shasta.trongrid.io")
        this.tronWeb = new TronWeb(node, node, node, 'E5DF8E10A25F4D46C1C5869DF825B7F3B38F246B51D21D41CA2E4D1A37799F8A')

        switch (this.chainInfo.blockchainName) {
            case 'TRON': this._scanner = new TronScanner(this.chainInfo); break;
            case 'TRON/SHASTA': this._scanner = new TronScanner(this.chainInfo); break;
            default:
                break;
        }

    }

    async account(privateKey?: string): Promise<{ address: string, privateKey: string }> {
        const tronWeb = this.tronWeb
        if (privateKey) {
            const address = await tronWeb.address.fromPrivateKey(privateKey)
            return { address, privateKey }
        } else {
            const generated = await tronWeb.createAccount()
            return { address: generated.address.base58, privateKey: generated.privateKey }
        }
    }


    // async isTransactionConfirmed(txHash: string): Promise<boolean> {

    // }

    // async getTransaction(txHash: string): Promise<Transaction> {

    // }

    async getBalance(address: string, currency = this.chainInfo.mainCurrency, unit: Unit = 'trx'): Promise<number> {
        currency ??= this.chainInfo.mainCurrency

        const tronWeb = this.tronWeb;
        let sun: number;
        let currencyInfo: CurrencyInfo;

        if (currency === this.chainInfo.mainCurrency) {
            sun = await tronWeb.trx.getBalance(address);
        } else if (currencyInfo = this.chainInfo.knownCurrencies[currency]) {
            switch (currencyInfo.std) {
                case 'TRC20': sun = await this._balanceTRC20(address, currencyInfo.address); break
                default: throw "UNSUPPORTED_STANDARD"
            }
        }
        else throw "UNKOWN_CURRENCY";

        return convert(sun, 'sun', unit)
    }

    private async _balanceTRC20(address: string, currencyAddress: string): Promise<number> {
        const tronWeb = this.tronWeb
        const contract = tronWeb.contract(TronBlockchainClient.TRC20_ABI, currencyAddress)
        const sun = await contract.methods.balanceOf(address).call()
        return sun;
    }

    getTransactions(address: string, query?: BlockchainScannerQuery): Promise<PaymentTransaction[]> {
        if (!this._scanner) throw new Error("The BlockchainInfo provided has no block scanner associated ...");
        return this._scanner.getTransactions(address, query);
    }


    async sendTransaction(privateKey: string, to: string, value: number, currency: string = this.chainInfo.mainCurrency, unit: Unit = 'trx'): Promise<Receipt> {
        const tronWeb = this.tronWeb
        tronWeb.setPrivateKey(privateKey)

        let currencyInfo: CurrencyInfo;
        let transactionReceipt: TransactionReceipt
        if (currency === this.chainInfo.mainCurrency) {
            transactionReceipt = await this._sendTransaction(privateKey, to, value, unit);
        } else if (currencyInfo = this.chainInfo.knownCurrencies[currency]) {
            switch (currencyInfo.std) {
                case 'TRC20': transactionReceipt = await this._sendTRC20Transaction(privateKey, currencyInfo.address, to, value, unit); break
                default: throw "UNSUPPORTED_STANDARD";
            }
        }
        else throw "UNKOWN_CURRENCY"

        const account = await this.account(privateKey)

        return {
            txID: transactionReceipt.transaction.txID,
            status: transactionReceipt.result,
            block: transactionReceipt.transaction.raw_data.ref_block_hash,
            timestamp: transactionReceipt.transaction.raw_data.timestamp,
            from: account.address,
            to: to,
            contractAddress: currencyInfo.address,
        }
    }



    private _sendTransaction(privateKey: string, to: string, value: number, unit: string = 'sun') {
        const tronWeb = this.tronWeb
        return tronWeb.trx.sendTransaction(to, value, privateKey)
    }

    private async _sendTRC20Transaction(privateKey: string, currencyAddress: string, to: string, value: number, unit: Unit = 'trx') {
        const tronWeb = this.tronWeb
        const sun = convert(value, unit, 'sun')

        let { transaction, result } = await tronWeb.transactionBuilder.triggerSmartContract(currencyAddress, 'transfer(address,uint256)',
            { feeLimit: 1_000_000, callValue: 0 }, //TRANSACTION
            [{ type: 'address', value: to }, { type: 'uint256', value: sun }] //INPUTS
        )

        if (!result.result) throw result

        const memo = "PURCHASE_ID"
        const unSignedTxnWithNote = await tronWeb.transactionBuilder.addUpdateData(transaction, memo)
        const signedTxn = await tronWeb.trx.sign(unSignedTxnWithNote)
        const recipt = await tronWeb.trx.sendRawTransaction(signedTxn)

        return recipt

    }






}
