import { Schema, Document } from "mongoose";
import { FileRecord } from "@noah-ark/common";


export interface FileDocumnet extends Document<string>, FileRecord { }


const fileSchema = new Schema({
    fieldname: { type: String, index: true },
    originalname: String,
    encoding: String,
    mimetype: { type: String, index: true },
    destination: { type: String, index: true },
    filename: { type: String, index: true },
    path: { type: String, index: true },
    size: Number,
    status: { type: Number, index: true },
    user: { type: String, index: true },
    date: { type: Date, index: true },
    meta: Object
}, { strict: false })

export default fileSchema;