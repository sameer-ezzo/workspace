import { ObjectId } from "mongodb";
import { Schema } from "mongoose";

const migrationSchema = new Schema({
    _id: ObjectId,
    name: { type: String, required: true, unique: true, index: true },
    collectionName: { type: String, required: true, index: true },
    date: { type: Date, index: true }
});

export type MigrationModel = { _id: ObjectId, name: string, collectionName: string, date: Date };
export type MigrationDocument = MigrationModel & Document


export default migrationSchema