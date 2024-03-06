// import { TronBlockchainClient } from "./tron-blockchain";
import { TronBlockchainClient } from "./tron-blockchain";
import { Web3BlockchainClient } from "./web3-blockchain";
import { BlockchainClient, BlockchainInfo, CommonBlockchains, COMMON_CHAINS } from "./_blockchain.base";

export function blockchain(blockchain: CommonBlockchains | BlockchainInfo, chainInfo?: Partial<BlockchainInfo>): Web3BlockchainClient | TronBlockchainClient {

    const blockchainName = typeof blockchain === 'string' ? blockchain : blockchain.blockchainName;
    let blockChainInfo = typeof blockchain === 'string' ? COMMON_CHAINS[blockchain] : blockchain;
    blockChainInfo = { ...blockChainInfo, ...chainInfo }


    switch (blockchainName) {

        //WEB3
        case 'ETH':
        case 'BSC':
        case 'BSC/TESTNET': return new Web3BlockchainClient(blockChainInfo); break
        case 'TRON': return new TronBlockchainClient(blockChainInfo); break
        case 'TRON/SHASTA': return new TronBlockchainClient(blockChainInfo); break

        default: throw "UNSUPPORTED_BLOCKCHAIN";
    }

}