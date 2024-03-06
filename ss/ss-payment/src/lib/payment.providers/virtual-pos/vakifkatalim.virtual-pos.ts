import { VirtualPos } from "./virtual-pos";

export class VakifkatilimVirtualPos extends VirtualPos {
    constructor(baseUrl: string, customerId: number, merchantId: number, username: string, password: string, name = "VakifkatilimSanalPos") {
        super(name, {
            payUrl: 'https://boa.vakifkatilim.com.tr/virtualpos.gateway/Home/ThreeDModelPayGate',
            approveUrl: 'https://boa.vakifkatilim.com.tr/sanalposservice/Home/ThreeDModelProvisionGate',
            payObjectWrapper: 'VPosMessageContract',
            approveObjectWrapper: 'VPosMessageContract',
            customerId: customerId.toString(),
            merchantId: merchantId.toString(),
            username,
            password,
            okUrl: `${baseUrl}/pay/ok`,
            failUrl: `${baseUrl}/pay/fail`,
        });

        this.payObjectStructure.CurrencyCode = "FECCurrencyCode";
    }
}

