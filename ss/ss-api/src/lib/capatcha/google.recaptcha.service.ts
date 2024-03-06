import { Injectable } from "@nestjs/common"
import { IncomingMessage } from "@noah-ark/common"
import { post } from "@ss/common"



@Injectable()
export class reCAPTCHAV2Response {
    "success": boolean
    "challenge_ts": string
    "hostname": string
    "error-codes"?: string[]
}

//ERROR CODES
// missing-input-secret	
// invalid-input-secret	
// missing-input-response	
// invalid-input-response	
// bad-request 
// timeout-or-duplicate	

const g_recaptcha_key = 'g-recaptcha-response';
export class reCAPTCHAService {

    constructor(readonly secret: string) {

    }
    version = 'v2'
    async verify(token: string, remoteip?: string) {
        const capatchaResponseString = await post('https://www.google.com/recaptcha/api/siteverify', {
            form: {
                secret: this.secret,
                response: token,
                remoteip
            }
        });
        const capatchaResponse = JSON.parse(capatchaResponseString) as reCAPTCHAV2Response;
        if (capatchaResponse.success) {
            return true;
        } else {
            throw capatchaResponse["error-codes"]
        }

    }

    hasRecapatchaResponse(msg: IncomingMessage<{ [g_recaptcha_key]: string }>) {
        if (!msg || msg.payload) return
        const k = g_recaptcha_key
        const recaptchaResponse = msg.payload[k] ?? msg.ctx.header?.[k]
        if (recaptchaResponse && typeof recaptchaResponse === 'string') {
            k in msg.payload ? delete msg.payload[k] : delete msg.ctx.header[k]
            return recaptchaResponse
        }
    }
}
