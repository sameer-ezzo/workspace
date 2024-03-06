import { Transaction } from "@nestjs/microservices/external/kafka.interface"
import { Currency } from "./currencies"
import { PaymentProvider } from "./model"

export type PaymentOption = {
    method: string
    type: string //transferin transferout
    currencies: Currency[]
    provider: string
    maxAmount?: number
}
export class PaymentConfig {
    transactionTimeout?: number
    paymentOptions: PaymentOption[]
}