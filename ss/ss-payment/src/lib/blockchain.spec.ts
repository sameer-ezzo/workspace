import { BlockchainClient, COMMON_CHAINS } from './blockchain-core/_blockchain.base';
import { blockchain } from './blockchain-core/_blockchain.function';
import axios from "axios"
import { Web3BlockchainClient } from './blockchain-core/web3-blockchain';
import { TronBlockchainClient } from './blockchain-core/tron-blockchain';

const TEST_CONFIG = {
    ETH: {
        wallet: {
            address: '0xaeff6578A8Ee5b0b7030cBd34d8924D1E937d57A',
            privateKey: '0xef4f62584b1fcca25a976a1c91a90ca979747de091a1b5fae68b14a66e93dc8f',
        }
    },
    TRON: {
        wallet: {
            privateKey: 'E5DF8E10A25F4D46C1C5869DF825B7F3B38F246B51D21D41CA2E4D1A37799F8A',
            address: 'TXM5v5XmDb7TxH7Jav4iofd2MrAz8yhHFo'
        }
    }
}

describe('Blockchain', () => {


    describe('BSC Binance Smart Chain Test (Identical to ETH)', () => {

        let chain: Web3BlockchainClient
        beforeAll(async () => {
            chain = blockchain('BSC/TESTNET', { scannerApiKey: '3Q6KYUHF1WWVT1HUSWX23AP24IK56RJ2CY' }) as Web3BlockchainClient
            await chain.connect()
        })

        it('GET WALLET', async () => {
            const account = await chain.account(TEST_CONFIG.ETH.wallet.privateKey)
            expect(account.address).toEqual(TEST_CONFIG.ETH.wallet.address)
        })

        it('CHECK BALANCE BNB', async () => {
            const balance = await chain.getBalance(TEST_CONFIG.ETH.wallet.address)
            console.info("bsc balance", balance)
            expect(balance).toBeGreaterThan(0)
        })

        it('CHECK BALANCE BEP20', async () => {
            const balance = await chain.getBalance(TEST_CONFIG.ETH.wallet.address, 'BUSD')
            expect(balance).toEqual(0)
        })

        it('GET TRANSACTIONS', async () => {
            const txs = await chain.getTransactions(TEST_CONFIG.ETH.wallet.address)
            const tx1 = txs.find(tx => tx.txID === '0xa3201662e6edd36ab8e8bc95d03cda34243dd61828f167876cb6255cdefb7280')
            const tx2 = txs.find(tx => tx.txID === '0x12bd4d6d41f5e1f7c0d359b9393d23e6beb10949baa5d21295643d1c4a217f50')

            expect(tx1.value).toEqual(500000000000000000)
            expect(tx2.value).toEqual(0)
        })

        // it('SEND TRANSACTION', async () => {
        //     const recipt = await chain.sendTransaction(CONFIG.ETH.wallet.privateKey, '0xe1200731Ba14bb72Ed4A108fc2Fd84AF61562332', 10, 'BUSD', 'ether')
        // })
    })

    describe('TRON Network test', () => {


        let chain: TronBlockchainClient
        beforeAll(async () => {
            chain = blockchain('TRON/SHASTA') as TronBlockchainClient
            await chain.connect()
        })


        it('CREATE WALLET', async () => {
            const account = await chain.account()
            expect(account.address).not.toBeNull()
            expect(account.privateKey).not.toBeNull()
        })

        it('GET WALLET', async () => {
            const account = await chain.account(TEST_CONFIG.TRON.wallet.privateKey)
            expect(account.address).toEqual(TEST_CONFIG.TRON.wallet.address)
        })

        it('CHECK BALANCE TRX', async () => {
            let balance = await chain.getBalance('TG5hL1bp3dxyoScqr9QXyC6MQmb63nTkWC')
            expect(balance).toBeGreaterThan(0)
        })

        it('CHECK BALANCE TRC20', async () => {
            let balance = await chain.getBalance('TCCfW5fKh1KMM87sADQD7ynVcR1qJAspaX', 'PiA')
            expect(balance).toBeGreaterThan(0)
        })


        it('GET TRANSACTIONS', async () => {

            // const txs = await chain.getTransactions(CONFIG.TRON.wallet.address)
            const txs = await chain.getTransactions('TCCfW5fKh1KMM87sADQD7ynVcR1qJAspaX')

            const tx1 = txs.find(tx => tx.txID == 'caa28b1b2d6d8b7ce16bcedd3841e09c5ad74c774dde305ea5b86cf48e5ae6a3')
            const tx2 = txs.find(tx => tx.txID == '1b82e04e4fa321a86b0938bb03a05dc4a17099fcb95930af07c7309a7a3f31bc')

            expect(tx1.value).toEqual(19530000)
            expect(tx1.currency).toEqual('PiA')
            expect(tx2.value).toEqual(10000000)
            expect(tx2.currency).toEqual('TRX')
        })


        // it('SEND TRANSACTION', async () => {
        //     const recipt = await chain.sendTransaction(CONFIG.TRON.wallet.privateKey, 'TCCfW5fKh1KMM87sADQD7ynVcR1qJAspaX', 100, 'PiA', 'sun')
        //     expect(recipt.txID).toBeDefined()
        // })

    })

})