import { Schema, Document, Types } from "mongoose";
import { Currency } from "./currencies";


const logSchema = new Schema({
    date: Date,
    userId: String,
    value: String
}, { strict: false })

export type Log = LogDocument & { [key: string]: any };
export interface LogDocument {
    date: Date;
    userId: string;
    value: string;
}

export type TransactionStatus = 'paused' | 'pending' | 'processing' | 'approved' | 'done' | 'rejected' | 'failed' | 'canceled' | 'returning' | 'returned'

export type Transaction = TransactionDocument & Record<string, any>

export interface TransactionDocument extends Document {
    _id: Types.ObjectId;
    type: 'transferin' | 'transferout' | 'return' | 'transfer'
    method: string
    name?: string //any identifying name
    timeout: number

    //LINKING
    userId: string
    redacted: boolean //to indecate that transaction no longer saves sensitive data such as payment card number

    //VALUE
    fees: number
    amount: number
    net: number
    currency: Currency

    //DATE
    dateRequested: Date
    dateOfExpiry?: Date
    dateProcessed?: Date
    dateResponded?: Date

    //STATUS
    status: TransactionStatus
    //CONFIRMATION CODES
    confirmationCode?: string
    approveCode?: string
    returnCode?: string
    //ERRORS
    error?: string
    reason?: string

    paymentInfo: any
    logs: Log[]
}

const transactionSchema = new Schema({
    _id: Types.ObjectId,
    type: { type: String, required: true, index: true },
    method: { type: String, required: true, index: true },
    name: String,

    userId: { type: String, required: true, index: true },
    redacted: Boolean,

    amount: { type: Number, required: true },
    net: { type: Number, required: true },
    currency: { type: String, required: true, index: true },

    dateRequested: Date,
    dateProcessed: Date,


    status: { type: String, required: true, index: true },

    error: String,
    reason: String,

    confirmationCode: { type: String, unique: true, sparse: true, required: false },
    approveCode: { type: String, unique: true, sparse: true, required: false },
    returnCode: String,

    logs: [logSchema]
}, { strict: false });

export default transactionSchema;


// transaction state machine
// (0) --entry--> Pending --confirm--> (Done) --approve--> Approved
// (0) --entry--> Pending --confirm--> (Failed)
// (0) --entry--> Pending --reject--> Rejected
// (0) --entry--> Pending --cancel--> Canceled

