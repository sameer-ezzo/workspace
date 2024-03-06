import { Schema } from "mongoose";

const changeSchema = new Schema({
    path: { type: String, index: true },

    user: Object,
    
    date: { type: Date, index: true },
    lastChange: { type: Date, index: true },

    patches: [{ op: String, path: String, value: Object }],
});

export default changeSchema;