//Todo rami
// import userSchema from "./auth/user.schema";
// import fileSchema from "./storage/schema";
import changeSchema from "./change-schema";
import { Schema, Model } from "mongoose";
// import tagSchema from "./auth/tag.schema";

const collections: { [name: string]: { schema: Schema, model?: Model<any>, exclude?: string[] } } = {
    // "user": { schema: userSchema, exclude: ["attempts", "passwordHash", "securityCode"] },
    // "tag": { schema: tagSchema },
    // "storage": { schema: fileSchema },
    // "change": { schema: changeSchema },
}

// export default collections;
