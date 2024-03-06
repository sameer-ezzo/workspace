import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class PaymentService {

    constructor(public http: HttpClient) {
        

    }
    async pay(method: string, amount: number, currency: string, model: any) {

        //types of payment
        //1. auto (automaticlly verify payment - timeout) (ex: payment card - gateways . etc ...)
        //each method has its own mechanisim so for server side only mechanisim it will happen within timeout or just fail
        // for client side mechanisim hmm
        // redirect user to client end and redirect back to our end to complete confirmation
        // so mechanisim can implment action and expect results of it
        
        

        //2. manual (ui is shown to backend to enter confirmation code) (ex: bank-transfer - pay at door - )
        //so ui is a list of pending payments that can be approved, rejected, set net value and write comments
        //this is related to notification service a lot (email - sms - push ...)


        //also data immutability and access should be hardly quistioned to makre sure integrity is kept (maybe use blockchain techniques)


        const payload = Object.assign({ method, amount, currency }, model);
        await this.http.post('/pay', payload);
    }

}