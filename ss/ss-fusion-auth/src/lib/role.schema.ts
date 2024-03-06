import { Schema } from "mongoose";

export const roleSchema = new Schema({
    _id: String,
    name: { type: String, required: true, index: true, unique: true },
    order: { type: Number, required: false },
}, { strict: false });
