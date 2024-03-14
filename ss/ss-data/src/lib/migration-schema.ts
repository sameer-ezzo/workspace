import { ObjectId } from "mongodb";
import { Schema } from "mongoose";

const migrationSchema = new Schema({
    _id: ObjectId,
    name: { type: String, required: true, index: true },
    date: { type: Date, index: true }
});

export type MigrationModel = { _id: string, name: string, date: Date };
export type MigrationDocument = MigrationModel & Document


export default migrationSchema