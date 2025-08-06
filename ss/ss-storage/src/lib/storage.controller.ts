import { Request, Response } from "express";
import * as fs from "fs";
import { StorageService, saveStreamToTmp, isFile, mv, makeDir, getStorageDir } from "./storage.service";
import { Controller, ExecutionContext, HttpException, HttpStatus, Inject, Res } from "@nestjs/common";
import { ImageService } from "./image.svr";

import * as Path from "path";
import type { IncomingMessage, IncomingMessageStream, PostedFile, File } from "@noah-ark/common";
import { Principle } from "@noah-ark/common";

import mongoose, { get } from "mongoose";
import { WriteFileOptions } from "fs";

import { DataService } from "@ss/data";
import { AuthorizeService } from "@ss/rules";
import { EndPoint, Message, MessageStream } from "@ss/common";
import { logger } from "./logger";
import { join } from "path";

async function _uploadToTmp(postedFile: PostedFile, ctx: ExecutionContext): Promise<File> {
    const path = ctx.switchToHttp().getRequest<Request>().path;
    return saveStreamToTmp(path, postedFile);
}

function isImgFile(path: string) {
    const ext = Path.extname(path);
    return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext);
}

@Controller("storage")
export class StorageController {
    constructor(
        @Inject(DataService) private readonly data: DataService,
        private readonly authorizeService: AuthorizeService,
        private readonly storageService: StorageService,
        private readonly imageService: ImageService,
    ) { }

    @EndPoint({ http: { method: "POST", path: "/" }, operation: "Upload New" })
    async post_(
        @MessageStream(_uploadToTmp)
        msg$: IncomingMessageStream<{ files: (File & { content?: string })[] } & Record<string, unknown>>,
    ) {
        return this.post(msg$);
    }

    @EndPoint({ http: { method: "POST", path: "**" }, operation: "Upload New" })
    async post(
        @MessageStream(_uploadToTmp)
        msg$: IncomingMessageStream<{ files: (File & { content?: string })[] } & Record<string, unknown>>,
    ) {
        const { access, rule, source, action } = this.authorizeService.authorize(msg$, "Upload New");
        if (access === "deny" || msg$.path.indexOf(".") > -1) throw new HttpException({ rule, action, source, q: msg$.query }, HttpStatus.FORBIDDEN);

        //            one file   //multi files
        //path not    create it   create them
        //path dir    create in   create in
        //path file        error (post can not modify)
        if (isFile(msg$.path)) throw new HttpException("PostCannotOverwriteExistingFile", HttpStatus.CONFLICT); //TODO stop the upload if this is the case

        if (msg$.payload!.files) {
            return await this._uploadBase64(msg$.path, msg$.principle!, msg$.payload!.files, msg$.query?.overwrite === "true");
        }

        try {
            //wait until req is finished
            const filesP = (await Promise.allSettled(msg$.streams)) ?? [];
            const files = filesP.filter((v) => v.status === "fulfilled").map((v: any) => v.value);
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (files.length == 1 || file.fieldname) {
                    const meta = files.length == 1 ? msg$.payload : msg$.payload![file.fieldname];
                    if (Array.isArray(meta)) file.meta = meta[i];
                    //TODO meta[i] this i should be the index of the file of the same fieldname not all files
                    else file.meta = meta;
                }
                file.user = msg$.principle?.sub;

                const tmp = file.path;
                const path = Path.join(file.destination, file.filename);
                if (fs.existsSync(path)) throw "CANNOT OVERWRITE"; //TODO error handle

                //mv file from tmp to path
                try {
                    mv(tmp, Path.join(getStorageDir(), path));
                    file.path = path;
                } catch (err) {
                    console.error("FILE NOT MOVED", err);
                } //TODO how error should be handled

                //maybe error should be reverted

                await this.storageService.saveToDb(file, msg$.principle);
            }
            if (files.length !== filesP.length) {
                logger.warn(`Some files were not uploaded. ${filesP.length - files.length} files were not uploaded.`);
            }

            return files;
        } catch (err) {
            logger.error(err);
            throw new HttpException(err, HttpStatus.BAD_REQUEST);
        }
    }

    @EndPoint({ http: { method: "PUT", path: "**" }, operation: "Upload Edit" })
    async put(
        @MessageStream(_uploadToTmp)
        msg$: IncomingMessageStream<{ files: File[] } & Record<string, unknown>>,
    ) {
        const { access, rule, source, action } = this.authorizeService.authorize(msg$, "Upload Edit");
        if (access === "deny" || msg$.path.indexOf(".") > -1) throw new HttpException({ rule, action, source, q: msg$.query }, HttpStatus.FORBIDDEN);

        //          one file   //multi files
        //path not        same as post
        //path dir        overwrite (validate and use filename no id generation)
        //path file overwrite    delete file and post files

        if (isFile(msg$.path)) await this.storageService.delete(msg$.path, msg$.principle);

        if (msg$.payload!.files) {
            return await this._uploadBase64(msg$.path, msg$.principle!, msg$.payload!.files, msg$.query?.overwrite === "true");
        }
        //wait until req is finished
        const files = (await Promise.all(msg$.streams)) ?? [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (file.fieldname) {
                const meta = msg$.payload![file.fieldname] as Record<string, unknown>;
                if (Array.isArray(meta)) file.meta = meta[i];
                //TODO meta[i] this i should be the index of the file of the same fieldname not all files
                else file.meta = meta;
            }
            file.user = msg$.principle?.sub;

            const tmp = file.path;
            const path = Path.join(file.destination, file.filename);
            file.path = path;

            if (fs.existsSync(path)) fs.unlinkSync(path);

            //mv file from tmp to path
            try {
                fs.renameSync(tmp, Path.join(getStorageDir(), path));
            } catch (err) {
                logger.error(err);
            } //TODO how error should be handled

            //maybe error should be reverted
            await this.storageService.saveToDb(file, msg$.principle);
        }

        return msg$;
    }

    private async _uploadBase64(path: string, user: Principle, files: (File & { content?: string })[], overwrite: boolean) {
        const separator = "/";
        for (let i = 0; i < files.length; i++) {
            const f = files[i] as any;

            const segments = path
                .replace(/\\/g, "/")
                .split(separator)
                .filter((s) => s);
            const filename = f.filename;
            const ext = Path.extname(filename);

            f._id = new mongoose.Types.ObjectId();
            f.originalname = filename;
            f.filename = f._id + ext;

            const destination: string = segments.join(separator);
            f.destination = destination;
            const targetPath = Path.join(getStorageDir(), destination);
            if (!fs.existsSync(targetPath)) makeDir(destination);

            f.path = Path.join(destination, f.filename);

            const buffer = Buffer.from((f.content, "base64"));
            f.size = buffer.length;
            f.encoding = "utf8";
            //f.mimetype //TODO

            try {
                await this.writeFile(Path.join(targetPath, f.filename), buffer);
            } catch (error) {
                throw new HttpException("Error", HttpStatus.BAD_REQUEST);
            }

            delete f.content;
            await this.storageService.saveToDb(f, user);
        }
        return files;
    }

    writeFile(path: any, data: any, options?: WriteFileOptions): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(path, data, options || null, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    _path(path: string) {
        return decodeURIComponent(path)
            .split("/")
            .filter((s) => s)
            .join("/");
    }

    @EndPoint({ http: { method: "DELETE", path: "**" }, operation: "Delete" })
    async delete(@Message() msg: IncomingMessage) {
        const { access, rule, source, action } = this.authorizeService.authorize(msg, "Delete");
        if (access === "deny") throw new HttpException({ rule, action, source, q: msg.query }, HttpStatus.FORBIDDEN);

        await this.storageService.delete(msg.path, msg.principle);
    }

    @EndPoint({ http: { method: "GET", path: "**" }, operation: "Read" })
    async download(@Message() msg: IncomingMessage, @Res() res: Response) {
        const { access, rule, source, action } = this.authorizeService.authorize(msg, "Read");
        if (access === "deny") throw new HttpException({ rule, action, source, q: msg.query }, HttpStatus.FORBIDDEN);

        const decodedPath = decodeURIComponent(msg.path.startsWith("/") ? msg.path.substring(1) : msg.path);
        if (!isFile(decodedPath)) throw new HttpException("File not found", HttpStatus.NOT_FOUND);

        const fname = Path.basename(decodedPath);

        const ext = Path.extname(decodedPath);

        const _id = fname.substring(0, fname.length - ext.length);

        const files = await this.data.get<File[]>("storage", { path: decodedPath });
        const file = files.find((f) => f._id === _id);
        const fullPath = join(getStorageDir(), (file ? file!.path : decodedPath).replace(`storage/`, ""));
        if (!file && !fs.existsSync(fullPath)) throw new HttpException("NOT_FOUND", HttpStatus.NOT_FOUND);

        const extension = Path.extname(fullPath).substring(1);

        const { attachment, format } = msg.query!;
        const originalFilename = (file ? file!.originalname : _id) + "." + extension;
        const encodedFilename = encodeURIComponent(originalFilename);
        const fallbackFilename = _id + "." + extension;

        const dispositionType = attachment ?? "inline";
        const contentDisposition = `${dispositionType}; filename="${fallbackFilename}"; filename*=UTF-8''${encodedFilename}`;
        res.setHeader("Content-Disposition", contentDisposition);

        if (attachment === "attachment") {
            res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

            res.download(fullPath, encodedFilename, (err) => {
                if (err) {
                    // Handle error, e.g., file not found or permission issues
                    logger.error(`Error downloading file: ${fullPath}`, err);
                    if (!res.headersSent) {
                        res.status(err["status"] || 500).send(`Error downloading file ${encodedFilename} ${err.message}`);
                    }
                }
            });
        } else {
            if (isImgFile(fullPath)) {
                const img = await this.imageService.get(getStorageDir(), decodedPath, msg.query!); // Retrieve the image stream
                if (!img) return res.status(404).send("");

                res.setHeader("Content-Type", `image/${format ?? extension}`);
                img.pipe(res);
            } else {
                const stream = fs.createReadStream(fullPath);
                res.setHeader("Content-Type", "application/octet-stream");
                stream.pipe(res);
            }
        }
    }
}
