import { hashSync, compare } from 'bcryptjs';
const bcrypt = { hashSync, compare }

import mongoose, { Schema } from "mongoose";

import { User, randomString } from "@noah-ark/common";



const userSchema = new Schema({
    __documentVersion: { type: Number, default: 1, required: true },
    __lockVersion: { type: Number, default: 0, required: true },
    _id: mongoose.Schema.Types.ObjectId,
    
    username: { type: String, required: true, index: true, unique: true },

    passwordHash: String,
    securityCode: String,
    forceChangePwd: { type: Boolean, default: undefined },


    email: { type: String, required: true, index: true, sparse: true, unique: true },
    emailVerified: { type: Boolean, default: false },

    phone: { type: String, required: false, index: true, sparse: true, unique: true },
    phoneVerified: { type: Boolean, default: false },

    disabled: Boolean,
    attempts: { type: Number, default: 0 },
    lastAttempt: Date,
    lastLogin: Date,

    lastPasswordHash: String,
    lastPasswordChange: Date,
    claims: Object,
    roles: [String]
}, { strict: false });

userSchema.virtual("password")
    .set(function (this: User, password: string) {
        this.passwordHash = bcrypt.hashSync(password, 10);
        this.securityCode = randomString(5);
        const self = <any>this;
        if (self.password) {
            delete self.password;
        }
    });

export default userSchema;



