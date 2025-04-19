import * as crypto from "crypto";

export function md5(text: string): Buffer {
    return crypto.createHash("md5").update(text).digest();
}

export function sha256(text: string): Buffer {
    return crypto.createHash("sha256").update(text).digest();
}
