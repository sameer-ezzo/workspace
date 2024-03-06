import { Schema } from "mongoose";

const tagSchema = new Schema({
    _id: String,
    name: { type: String, required: true, index: true },
    class: { type: String, index: true, default: undefined },
    parent: { type: String, index: true, default: undefined },
    parentPath: { type: String, index: true, default: '/' },
    meta: { type: Schema.Types.Mixed, default: undefined }
}, { strict: true });
tagSchema.index({ name: 1, parentPath: 1 }, { unique: true });
export default tagSchema;
