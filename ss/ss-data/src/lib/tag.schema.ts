import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

@Schema({ _id: false, strict: true, timestamps: true })
class TranslationDocument {
    @Prop({ type: String, index: true, unique: true })
    lang: string;
    @Prop({ type: mongoose.Schema.Types.Mixed })
    translation: any;
}

@Schema({ strict: false, timestamps: true })
export class TagModel {
    @Prop({ type: String })
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

    @Prop({ type: String, index: true, required: true, default: "en" })
    lang: string;

    @Prop({ type: mongoose.Schema.Types.String, index: true })
    translation_id: string;

    @Prop({ type: [TranslationDocument], default: undefined })
    translations: TranslationDocument[];
}
export const TagSchema = SchemaFactory.createForClass(TagModel);
TagSchema.index({ 'translations.lang': 1 }, { unique: true });
