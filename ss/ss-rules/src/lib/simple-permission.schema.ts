import { Schema } from "mongoose";

export const SimplePermissionSchema = new Schema(
    {
        _id: String,
        name: { type: String, required: true, index: true },
        rule: { type: String, required: true, index: true },
        action: { type: String, required: true, index: true },
        createDate: { type: Date, required: true },
        builtIn: { type: Boolean, default: false },
        type: { type: String, required: false, index: true },
        value: { type: String, required: false },
        access: { type: String, required: false }
    },
    { strict: true }
)