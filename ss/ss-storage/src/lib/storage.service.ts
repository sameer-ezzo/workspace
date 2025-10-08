import { DataService } from "@ss/data";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import * as Path from "path";
import * as os from "os";

//file should be reachable by id (path independent)
//logs (save hostory)
//save meta data for file

//files should be queriable (search+filtering+sorinting)
//detect orphans (file in db not in disk or vice versa) / cleaning job

// import mongoose from "mongoose"
// import { rejects } from "assert"

import { execSync } from "child_process";
import { PostedFile, File } from "@noah-ark/common";
import mongoose from "mongoose";
import { join } from "path";
import { createWriteStream, existsSync, mkdirSync, opendirSync, renameSync, statSync } from "fs";

const separator = "/";

export function getStorageDir() {
    const base = process.env.STORAGE_DIR || __dirname;
    return base.endsWith("storage") ? base : join(base, "storage");
}
export function makeDir(dir: string) {
    dir = joinStoragePath(dir.replace(/\\/g, "/"));
    if (existsSync(dir)) return;

    const segments = dir.split(separator);
    segments[0] = "/";
    for (let i = 1; i < segments.length; i++) {
        segments[i] = join(segments[i - 1], segments[i]);
    }
    for (let i = 1; i < segments.length; i++) {
        const dir = segments[i];
        if (!dir || dir === "." || dir === "..") continue;
        if (!existsSync(dir)) mkdirSync(dir);
    }
}

export function mv(oldpath: string, newpath: string) {
    execSync(`mv "${oldpath}" "${newpath}"`);
}
export function mvToStorage(oldpath: string, newpath: string) {
    const newPathFull = join(getStorageDir(), normalizePath(newpath));
    const dirSegments = newPathFull.split("/");
    dirSegments.pop();
    const newPathFullDir = dirSegments.join("/");
    if (!isDir(newPathFullDir)) makeDir(newPathFullDir);
    mv(oldpath, newPathFull);
}

export function joinStoragePath(...segments: string[]) {
    const base = getStorageDir();
    const t = join(...segments);
    const normalized = normalizePath(t);
    return normalized.startsWith(base) ? normalized : join(base, normalized);
}
export function isDir(path: string): boolean {
    try {
        opendirSync(joinStoragePath(path));
        return true;
    } catch (error) {
        return false;
    }
}

export const normalizePath = (path: string, base = "storage") => {
    const decoded = decodeURIComponent(path.startsWith("/") ? path.substring(1) : path);
    return decoded.replace(new RegExp(`^${base}/|/${base}$|^${base}$`, "ig"), "");
};

export function isFile(path: string) {
    const p = joinStoragePath(path);
    return existsSync(p) && !isDir(path);
}

export function toObjectId(id: string): mongoose.Types.ObjectId | undefined {
    try {
        return mongoose.Types.ObjectId.createFromHexString(id) as mongoose.Types.ObjectId;
    } catch (error) {
        return undefined;
    }
}

export async function saveStreamToTmp(path: string, file: PostedFile): Promise<File> {
    return new Promise<File>((resolve, reject) => {
        const segments = path
            .replace(/\\/g, "/")
            .split(separator)
            .filter((s) => s);
        if (segments.length === 0) reject(`Invalid path ${path}`);
        let filename = segments.pop()!;

        let ext = Path.extname(filename!) ?? "";
        let _id: string;

        if (ext.length > 0) _id = filename.substring(0, filename.length - ext.length);
        else {
            segments.push(filename); //path originally points to dir so put the file name back
            ext = Path.extname(file.originalname);
            _id = file.originalname.substring(file.originalname.length - ext.length);
            if (!toObjectId(_id)) _id = new mongoose.Types.ObjectId().toHexString();
        }

        filename = _id + ext;

        const tmp = join(os.tmpdir(), filename);
        const fileStream = file.stream as any;
        const ws = createWriteStream(tmp);

        fileStream.on("error", (err: any) => reject({ msg: "FileStreamError", error: err }));
        fileStream.on("end", () => {
            ws.close();
        });
        ws.on("finish", () => {
            const stats = statSync(tmp);

            const destination = segments.join(separator);
            try {
                makeDir(destination);
            } catch (err) {
                reject({ msg: "InvalidOperation:CreateDirectory", error: err });
            }

            const { stream, ...filebase } = file;
            const result = {
                _id,
                destination,
                filename,
                path: tmp,
                size: stats.size,
                status: 0,
                date: new Date(),
                ...filebase,
            } as File;

            resolve(result);
        });
        fileStream.pipe(ws);
    });
}

@Injectable()
export class StorageService {
    constructor(private data: DataService) {
        // this.data.addModel('storage', FileSchema).then(() => { })
    }

    async saveToDb(f: File, principle: any) {
        const id = f._id;
        const s = await this.data.find<File>(`storage`, id);
        if (s) {
            const { path, patches } = this.data.toPatches(`/storage/${f._id}`, f);
            await this.data.patch(`/storage/${f._id}`, patches, principle);
        } else {
            const model = await this.data.getModel("storage");
            await model.create([f]);
        }
    }

    async delete(path: string, principle: any) {
        const segments = path.replace(/\\/g, "/").split(separator);
        const filename = segments[segments.length - 1];
        const ext = Path.extname(filename);
        if (!ext) throw new HttpException("InvalidPath", HttpStatus.BAD_REQUEST);
        const _id = filename.substring(0, filename.length - ext.length);

        const doc = await this.data.get<File>(`storage/${_id}`);
        if (!doc) throw new HttpException("No file found", HttpStatus.NOT_FOUND);

        await this.data.delete(`storage/${_id}`, principle);
        const fPath = join(getStorageDir(), doc.path);
        if (!existsSync(fPath)) return;
        const trashedDir = join(getStorageDir(), "storage/_trashed");
        if (!existsSync(trashedDir)) mkdirSync(trashedDir, { recursive: true });

        try {
            renameSync(fPath, join(getStorageDir(), "storage/_trashed", filename)); //TODO clean-up job
        } catch (err) {
            console.error(err);
        }
    }
}
