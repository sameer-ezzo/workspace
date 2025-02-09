import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

@Schema({ strict: false, timestamps: true })
export class TagModel {
    @Prop({ type: mongoose.SchemaTypes.ObjectId })
    _id: string;

    @Prop({ required: true, index: true, unique: true })
    slug: string;

    @Prop({ required: true, index: true })
    name: string;

    @Prop({ required: true, default: "/" })
    path: string;

    @Prop({ required: true, default: null })
    parentPath: string;

    @Prop({ type: mongoose.SchemaTypes.Mixed, index: true, default: undefined })
    parentId: string;

    @Prop({ default: undefined })
    description?: string;

    @Prop({ default: 0 })
    order?: number;

    @Prop({ index: true, default: undefined })
    class?: string;

    @Prop({ type: mongoose.SchemaTypes.Mixed, default: undefined })
    meta?: Record<string, unknown>;

    @Prop({ type: [mongoose.SchemaTypes.Mixed], default: undefined })
    translations?: Record<string, unknown>;
}
export const TagSchema = SchemaFactory.createForClass(TagModel);
