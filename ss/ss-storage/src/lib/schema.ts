import { Schema, Document } from "mongoose";
import { FileRecord } from "@noah-ark/common";


export interface FileDocument extends Document<string>, FileRecord { }


export const FileSchema = new Schema({
    _id: String,
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

export default FileSchema;