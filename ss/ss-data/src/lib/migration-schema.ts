import mongoose, { Schema } from "mongoose";

const migrationSchema = new Schema({
    __documentVersion: { type: Number, default: 1, required: true },
    __lockVersion: { type: Number, default: 0, required: true },
    _id: mongoose.Schema.Types.ObjectId,

    name: { type: String, required: true, unique: true, index: true },
    collectionName: { type: String, required: true, index: true },
    date: { type: Date, index: true }
});

export type MigrationModel = {
    _id: mongoose.Schema.Types.ObjectId, name: string, collectionName: string, date: Date, 
    __documentVersion?: number,
    __lockVersion?: number,
};
export type MigrationDocument = MigrationModel & Document


export default migrationSchema