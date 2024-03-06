import { Transaction, TransactionStatus } from "./transaction.schema";
import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import type { IncomingMessage } from "@noah-ark/common";
import { PaymentService } from "./payment.svr";
import { EndPoint, Message } from "@ss/common";


@Controller('pay')
export class PaymentController {

    constructor(private readonly paymentservice: PaymentService) { }

    @EndPoint({ http: { path: '', method: 'POST' } })
    public async process(@Message() msg: IncomingMessage<Transaction>) {

        const user = msg.principle
        if (!user) throw new HttpException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);

        const transaction: Transaction = msg.payload;

        if (transaction.status || transaction.confirmationCode || transaction.dateRequested || transaction.dateProcessed)
            throw new HttpException("OVER_POST_PROTECTION!", HttpStatus.NOT_ACCEPTABLE)

        // validate basic data
        const err = this.paymentservice.validate(transaction)
        if (err) throw new HttpException(err, HttpStatus.BAD_REQUEST)

        // validate amount

        // get payment service (validate method + amount + currency)
        const ip = msg.ctx?.ip as string; //maybe server is running behind a reverse proxy
        return this.paymentservice.create(user, transaction, { ip })

    }


    //TODO limit this request to one by user (a user can't perform multi-transactions)
    @Get('status')
    public async status(@Message() msg: IncomingMessage<{ id: string }>) {
        /// STEP 1 : VALIDATE & AUTHORIZE
        const user = msg.principle
        if (!user) throw new HttpException("", HttpStatus.UNAUTHORIZED)

        const id = msg.payload.id
        const transaction = await this.paymentservice.getStatus(id);
        if (transaction.userId != user.sub && user.roles.indexOf('super-admin') === -1)
            throw new HttpException("", HttpStatus.FORBIDDEN)

    }

    @EndPoint({ http: { path: 'approved', method: 'POST' } })
    approved(@Message() msg: IncomingMessage<{ id: string }>) {
        const payload = { ...msg.payload, status: 'approved' as TransactionStatus }
        return this.changeStatus({ ...msg, payload })
    }


    @EndPoint({ http: { path: 'rejected', method: 'POST' } })
    rejected(@Message() msg: IncomingMessage<{ id: string }>) {
        const payload  = { ...msg.payload, status: 'rejected' as TransactionStatus }
        return this.changeStatus({ ...msg, payload })
    }


    @EndPoint({ http: { path: 'canceled', method: 'POST' } })
    canceled(@Message() msg: IncomingMessage<{ id: string }>) {
        const payload = { ...msg.payload, status: 'canceled' as TransactionStatus }
        return this.changeStatus({ ...msg, payload })
    }


    @EndPoint({ http: { path: 'done', method: 'POST' } })
    done(@Message() msg: IncomingMessage<{ id: string }>) {
        const payload = { ...msg.payload, status: 'done' as TransactionStatus }
        return this.changeStatus({ ...msg, payload })
    }

    @EndPoint({ http: { path: 'failed', method: 'POST' } })
    failed(@Message() msg: IncomingMessage<{ id: string }>) {
        const payload = { id: msg.payload?.id as string, status: 'failed' as TransactionStatus }
        return this.changeStatus({ ...msg, payload })
    }

    @EndPoint({ http: { path: 'processing', method: 'POST' } })
    processing(@Message() msg: IncomingMessage<{ id: string }>) {
        const payload = { id: msg.payload?.id as string, status: 'processing' as TransactionStatus }
        return this.changeStatus({ ...msg, payload })
    }


    @EndPoint({ http: { path: 'status', method: 'POST' } })
    public async changeStatus(@Message() msg: IncomingMessage<{ id: string, status: TransactionStatus }>) {
        const user = msg.principle
        if (!user) throw new HttpException("UNAUTHORIZED", HttpStatus.UNAUTHORIZED) //at least not open to public
        if (user.roles.indexOf('super-admin') === -1) throw new HttpException("FORBIDDEN", HttpStatus.FORBIDDEN)

        const requiredStatus = msg.payload.status
        const id = msg.payload.id
        return this.paymentservice.changeState(user, id, requiredStatus, msg.payload)
    }


}