//import { Unit } from 'web3-utils';
import { BlockchainScannerQuery } from '../blockchain-scanner/blockchain-scanner';


export type CurrencyInfo = { address: string, std: string }
export type CommonBlockchains = 'BSC-TESTNET' | 'BSC' | 'ETH' | string

export type BlockchainInfo = {
    blockchainName: CommonBlockchains | string
    providerUrl: string
    mainCurrency: string
    tokenDecimal: number
    knownCurrencies: { [currency: string]: CurrencyInfo } //currency => address
    requiredConfirmations: number

    scannerApiKey?: string
};


export const COMMON_CHAINS: { [chain: string]: BlockchainInfo } = {
    BSC: {
        blockchainName: 'BSC',
        tokenDecimal: 18,
        providerUrl: "https://bsc-dataseed1.binance.org:443",
        mainCurrency: 'BNB',
        requiredConfirmations: 24,
        knownCurrencies: {
            BUSD: { std: 'ERC20', address: '0x55d398326f99059ff775485246999027b3197955' },
            USDC: { std: 'ERC20', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d' },
            USDT: { std: 'TRC20', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' },

        }
    },
    ['BSC/TESTNET']: {
        blockchainName: 'BSC/TESTNET',
        tokenDecimal: 18,
        providerUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
        mainCurrency: 'BNB',
        requiredConfirmations: 10,
        knownCurrencies: {
            BUSD: { std: 'ERC20', address: '0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee' }
        }
    },

    TRON: {
        blockchainName: 'TRON',
        tokenDecimal: 6,
        providerUrl: "https://api.trongrid.io/v1",
        mainCurrency: 'TRX',
        requiredConfirmations: 10,
        knownCurrencies: {
            USDT: { std: 'TRC20', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' },
            USDC: { std: 'TRC20', address: 'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8' },
            TUSD: { std: 'TRC20', address: 'TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4' },
        }
    },
    ['TRON/SHASTA']: {
        blockchainName: 'TRON/SHASTA',
        tokenDecimal: 6,
        providerUrl: "https://api.shasta.trongrid.io/v1",
        mainCurrency: 'TRX',
        requiredConfirmations: 10,
        knownCurrencies: {
            PiA: { std: 'TRC20', address: 'TQKucgWL1cbAtW8vxKbwRgThw3FPmrok2t' },
        }
    }
}

export type PaymentTransaction = {
    result: boolean
    timeStamp: number //ms
    txID: string

    from: string
    to: string
    currency: string

    value: number
    tokenDecimal: number

    cost: Record<string, number>
    block: {
        blockNumber?: number
        blockHash?: string
    }

    confirmations: number
    type: 'in' | 'out'
}


export type Receipt = {
    status: boolean
    txID: string
    timestamp: number
    block: number | string
    from: string
    to: string
    contractAddress?: string
    cost?: Record<string, number>
}


export type BlockchainClient = {
    readonly chainInfo: BlockchainInfo
    connect(): Promise<void>
    account(privateKey?: string): Promise<{ address: string, privateKey: string }>
    getBalance(address: string, currency?: string, unit?: string): Promise<number>
    getTransactions(address: string, query?: BlockchainScannerQuery): Promise<PaymentTransaction[]>
    sendTransaction(privateKey: string, to: string, value: number, currency: string, unit: string, memo?: string): Promise<Receipt>
}