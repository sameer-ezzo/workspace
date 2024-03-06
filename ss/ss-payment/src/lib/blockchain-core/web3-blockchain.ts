import Web3, { TransactionReceipt } from 'web3';
import { BlockchainClient, BlockchainInfo, CurrencyInfo, PaymentTransaction, Receipt } from './_blockchain.base';

import { EthScanner } from '../blockchain-scanner/eth.scanner';
import { BlockchainScanner, BlockchainScannerQuery } from '../blockchain-scanner/blockchain-scanner';



export class Web3BlockchainClient implements BlockchainClient {

    static ERC20_ABI = [
        { "constant": true, "inputs": [{ "name": "_addr", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" },
        { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" },
        { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }
    ] as any[] // AbiItem[];


    web3: Web3;
    _scanner: BlockchainScanner;

    constructor(public readonly chainInfo: BlockchainInfo) { }

    async connect() {
        this.web3 = new Web3(this.chainInfo.providerUrl);
        const blockNumber = await this.web3.eth.getBlockNumber();
        if (!blockNumber) throw "COULD_NOT_CONNECT_TO_PROVIDER";


        switch (this.chainInfo.blockchainName) {
            case 'BSC': this._scanner = new EthScanner(this.chainInfo); break;
            case 'BSC/TESTNET': this._scanner = new EthScanner(this.chainInfo); break;
            case 'ETH': this._scanner = new EthScanner(this.chainInfo); break;
            default:
                break;
        }
    }

    async account(privateKey?: string): Promise<any> {  //Promise<Account> {
        const web3 = this.web3;

        const account = privateKey ?
            web3.eth.accounts.privateKeyToAccount(privateKey) :
            web3.eth.accounts.create()

        return account;
    }

    private async _getConfirmations(txHash: string): Promise<number> {
        const receipt = await this.web3.eth.getTransactionReceipt(txHash);
        const currentBlock = BigInt(await this.web3.eth.getBlockNumber());
        return receipt?.blockNumber === null ? 0 : Number(currentBlock - BigInt(receipt.blockNumber));
    }

    async isTransactionConfirmed(txHash: string): Promise<boolean> {
        const confirmations = await this._getConfirmations(txHash);
        return confirmations > this.chainInfo.requiredConfirmations;
    }

    async getTransaction(txHash: string): Promise<any> { //  Promise<Transaction> {
        return this.web3.eth.getTransaction(txHash);
    }

    async getBalance(address: string, currency?: string, unit = 'ether'): Promise<number> {
        currency ??= this.chainInfo.mainCurrency

        const web3 = this.web3;
        let wei: string;
        let currencyInfo: CurrencyInfo;

        if (currency === this.chainInfo.mainCurrency) {
            wei = (await web3.eth.getBalance(address)).toString();
        } else if (currencyInfo = this.chainInfo.knownCurrencies[currency]) {
            switch (currencyInfo.std) {
                case 'ERC20': wei = await this._balanceERC20(address, currencyInfo.address); break
                default: throw "UNSUPPORTED_STANDARD"
            }
        }
        else throw "UNKOWN_CURRENCY"

        return +(web3.utils.fromWei(wei, unit as any));
    }

    private async _balanceERC20(address: string, currencyAddress: string): Promise<string> {
        const web3 = this.web3;

        const contract = new web3.eth.Contract(Web3BlockchainClient.ERC20_ABI, currencyAddress, { from: address });
        const wei = await contract.methods.balanceOf(address).call();
        return wei as unknown as string;
    }


    async sendTransaction(privateKey: string, to: string, value: number, currency: string = this.chainInfo.mainCurrency, unit = 'ether'): Promise<Receipt> {
        let currencyInfo: CurrencyInfo;
        let ransactionRecipt: TransactionReceipt
        if (currency === this.chainInfo.mainCurrency) {
            ransactionRecipt = await this._sendTransaction(privateKey, to, value, unit);
        } else if (currencyInfo = this.chainInfo.knownCurrencies[currency]) {
            switch (currencyInfo.std) {
                case 'ERC20': ransactionRecipt = await this._sendERC20Transaction(privateKey, currencyInfo.address, to, value, unit); break
                default: throw "UNSUPPORTED_STANDARD";
            }
        }
        else throw "UNKOWN_CURRENCY";

        const web3 = this.web3
        const block = await web3.eth.getBlock(ransactionRecipt.blockNumber)
        return {
            status: ransactionRecipt.status,
            timestamp: Number(block.timestamp) as number,
            block: ransactionRecipt.blockNumber,
            txID: ransactionRecipt.transactionHash,

            from: ransactionRecipt.from,
            to: ransactionRecipt.to,

            contractAddress: ransactionRecipt.contractAddress,
            cost: {
                gasUsed: ransactionRecipt.gasUsed,
                cumulativeGasUsed: ransactionRecipt.cumulativeGasUsed,
            }

        } as any
    }

    private async _wrapTransaction(from: string, to: string, wei: string, data?: string): Promise<any> { //Promise<TransactionConfig> {
        const web3 = this.web3;


        const nonce = await web3.eth.getTransactionCount(from);

        return {
            nonce,
            from,
            to,
            value: wei,
            data,

            gas: 100000,
            // gasPrice: await web3.eth.getGasPrice(),
        };
    }

    private async _sendTransaction(privateKey: string, to: string, value: number, unit = 'ether'): Promise<TransactionReceipt> {
        const web3 = this.web3;
        const fromAccount = await this.account(privateKey);
        const from = fromAccount.address;

        const wei = web3.utils.toWei(value + '', unit as any); // Cast 'unit' to 'any' to bypass the type checking.
        const amount = web3.utils.toHex(wei);

        const tx = await this._wrapTransaction(from, to, amount);
        const signed = await this.web3.eth.accounts.signTransaction(tx, privateKey);

        const recipte = await this.web3.eth.sendSignedTransaction(signed.rawTransaction);
        return recipte;
    }

    private async _sendERC20Transaction(privateKey: string, currencyAddress: string, to: string, value: number, unit = 'ether'): Promise<TransactionReceipt> {
        const web3 = this.web3;
        const account = await this.account(privateKey);
        const from = account.address;

        const wei = web3.utils.toWei(value + '', unit as any); // Cast 'unit' to 'any' to bypass the type checking.
        const amount = web3.utils.toHex(wei);

        const contract = new web3.eth.Contract(Web3BlockchainClient.ERC20_ABI, currencyAddress, { from });
        const contractFunctionInput = contract.methods.transfer(to, amount).encodeABI();

        const tx = await this._wrapTransaction(from, currencyAddress, '0x0', contractFunctionInput);
        const signed = await web3.eth.accounts.signTransaction(tx, privateKey);

        const recipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        return recipt;
    }

    getTransactions(address: string, query?: BlockchainScannerQuery): Promise<PaymentTransaction[]> {
        if (!this._scanner) throw new Error("The BlockchainInfo provided has no block scanner associated ...");
        return this._scanner.getTransactions(address, query);
    }

}
