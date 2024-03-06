import { Model, Schema } from "mongoose";

export type DbCollectionInfo = {
    [collection: string]: { schema: Schema; model?: Model<unknown>; exclude?: string[]; };
};
