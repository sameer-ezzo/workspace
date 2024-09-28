import { Schema } from 'mongoose';

const tagSchema = new Schema(
    {
        _id: String,
        // _id: { type: String, required: true, index: true },
        name: { type: String, required: true, index: true },
        description: String,
        order: { type: Number, default: 0 },
        class: { type: String, index: true, default: undefined },
        parent: { type: String, index: true, default: undefined },
        parentPath: { type: String, index: true, required: true, default: '/' },
        meta: { type: Schema.Types.Mixed, default: undefined },
        translations: { type: Schema.Types.Mixed },
    },
    { strict: false, timestamps: true }
);
tagSchema.index({ name: 1, parentPath: 1 }, { unique: true });
export default tagSchema;
