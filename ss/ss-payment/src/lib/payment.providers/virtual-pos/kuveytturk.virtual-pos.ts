import { VirtualPos } from "./virtual-pos";


export class KuveytturkVirtualPos extends VirtualPos {
    constructor(
        private readonly customerId: string,
        private readonly merchantId: string,
        private readonly username: string,
        private readonly password: string,
        private readonly okUrl: string,
        private readonly failUrl: string
    ) {

        super("SanalPos", {
            payUrl: 'https://boa.kuveytturk.com.tr/sanalposservice/Home/ThreeDModelPayGate',
            approveUrl: 'https://boa.kuveytturk.com.tr/sanalposservice/Home/ThreeDModelProvisionGate',
            payObjectWrapper: 'KuveytTurkVPosMessage',
            approveObjectWrapper: 'KuveytTurkVPosMessage',
            customerId, merchantId, username, password, okUrl, failUrl
        });
    }

}
