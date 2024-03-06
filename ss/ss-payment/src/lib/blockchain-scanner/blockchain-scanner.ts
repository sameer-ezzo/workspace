import { PaymentTransaction } from "../blockchain-core/_blockchain.base"


export type BlockchainScannerQuery = {
    currencies?: string[]
    allowUnkownCurrencies?: boolean
    page?: number
}

export type BlockchainScanner = {

    getTransactions(address: string, query?: BlockchainScannerQuery): Promise<PaymentTransaction[]>
}