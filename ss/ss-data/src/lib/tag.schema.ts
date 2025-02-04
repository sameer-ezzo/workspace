import mongoose, { Schema } from "mongoose";

const tagSchema = new Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        slug: { type: String, required: true, index: true },
        name: { type: String, required: true, index: true },
        description: { type: String, default: undefined },
        order: { type: Number, default: 0 },
        class: { type: String, index: true, default: undefined },
        path: { type: String, index: true, required: true, default: "/" },
        parentId: { type: String, index: true, default: undefined },
        parentPath: { type: String, index: true, required: true, default: null },
        meta: { type: Schema.Types.Mixed, default: undefined },
        translations: { type: Schema.Types.Mixed, default: undefined },
    },
    { strict: false, timestamps: true },
);
tagSchema.index({ name: 1, parentPath: 1 }, { unique: true });
export default tagSchema;
