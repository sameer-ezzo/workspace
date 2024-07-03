import { Request, Response } from "express"
import * as fs from "fs"
import { StorageService, saveStreamToTmp, isFile, toObjectId, mv, makeDir } from "./storage.service"
import { Controller, ExecutionContext, HttpException, HttpStatus, Res } from "@nestjs/common"
import { ImageService } from "./image.svr"

import * as Path from "path"
import type { IncomingMessage, IncomingMessageStream, PostedFile, File } from "@noah-ark/common"
import { Principle, Rule } from "@noah-ark/common"


import mongoose, { Model } from 'mongoose'
import { WriteFileOptions } from "fs"

import { DataService } from "@ss/data"
import { Authorize, AuthorizeService } from "@ss/rules"
import { EndPoint, Message, MessageStream } from "@ss/common"
import { logger } from "./logger"


async function _uploadToTmp(postedFile: PostedFile, ctx: ExecutionContext): Promise<File> {
    const path = ctx.switchToHttp().getRequest<Request>().path
    return saveStreamToTmp(path, postedFile)
}


@Controller('storage')
export class StorageController {
    constructor(private readonly data: DataService,
        private readonly authorizeService: AuthorizeService,
        private readonly storageService: StorageService,
        private readonly imageService: ImageService) {
    }



    // @EndPoint({ http: { method: 'POST', path: '**' } })
    // @Authorize('create')
    @EndPoint({ http: { method: 'POST', path: '**' }, cmd: 'storage/create', operation: 'create' })
    @Authorize({ by: 'role', value: 'super-admin' })
    async post(@MessageStream(_uploadToTmp) msg$: IncomingMessageStream<{ files: (File & { content?: string })[] } & Record<string, unknown>>) {
        logger.info(`POST ${msg$.path}`)
        const { access, rule, source, action } = this.authorizeService.authorize(msg$, 'create')
        if (access === 'deny' || msg$.path.indexOf('.') > -1) throw new HttpException({ rule, action, source, q: msg$.query }, HttpStatus.FORBIDDEN)


        //            one file   //multi files
        //path not    create it   create them
        //path dir    create in   create in
        //path file        error (post can not modify)
        if (isFile(msg$.path))
            throw new HttpException("PostCannotOverwriteExistingFile", HttpStatus.CONFLICT) //TODO stop the upload if this is the case

        if (msg$.payload!.files) {
            return await this._uploadBase64(msg$.path, msg$.principle!, msg$.payload!.files, msg$.query?.overwrite === 'true')
        }

        try {

            //wait until req is finished
            const filesP = (await Promise.allSettled(msg$.streams)) ?? []
            const files = filesP.filter(v => v.status === 'fulfilled').map((v: any) => v.value)
            for (let i = 0; i < files.length; i++) {
                const file = files[i]

                if (files.length == 1 || file.fieldname) {
                    const meta = files.length == 1 ? msg$.payload : msg$.payload![file.fieldname]
                    if (Array.isArray(meta)) file.meta = meta[i] //TODO meta[i] this i should be the index of the file of the same fieldname not all files
                    else file.meta = meta
                }
                file.user = msg$.principle?.sub

                const tmp = file.path
                const path = Path.join(file.destination, file.filename)

                if (fs.existsSync(path)) throw "CANNOT OVERWRITE" //TODO error handle

                //mv file from tmp to path
                try {
                    mv(tmp, Path.join(__dirname, path))
                    file.path = path
                }
                catch (err) { console.error("FILE NOT MOVED", err) } //TODO how error should be handled

                //maybe error should be reverted


                await this.storageService.saveToDb(file, msg$.principle)
            }
            if (files.length !== filesP.length) {
                logger.warn(`Some files were not uploaded. ${filesP.length - files.length} files were not uploaded.`)
            }

            return files
        }
        catch (err) {
            logger.error(err)
            throw new HttpException(err, HttpStatus.BAD_REQUEST)
        }
    }


    @EndPoint({ http: { method: 'PUT', path: '**' }, cmd: 'storage/edit', operation: 'edit' })
    @Authorize({ by: 'role', value: 'super-admin' })
    async put(@MessageStream(_uploadToTmp) msg$: IncomingMessageStream<{ files: File[] } & Record<string, unknown>>) {
        const { access, rule, source, action } = this.authorizeService.authorize(msg$, 'edit')
        if (access === 'deny' || msg$.path.indexOf('.') > -1) throw new HttpException({ rule, action, source, q: msg$.query }, HttpStatus.FORBIDDEN)

        //          one file   //multi files
        //path not        same as post
        //path dir        overwrite (validate and use filename no id generation)
        //path file overwrite    delete file and post files

        if (isFile(msg$.path)) await this.storageService.delete(msg$.path, msg$.principle)


        if (msg$.payload!.files) {
            return await this._uploadBase64(msg$.path, msg$.principle!, msg$.payload!.files, msg$.query?.overwrite === 'true')
        }
        //wait until req is finished
        const files = (await Promise.all(msg$.streams)) ?? []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]

            if (file.fieldname) {
                const meta = msg$.payload![file.fieldname] as Record<string, unknown>
                if (Array.isArray(meta)) file.meta = meta[i] //TODO meta[i] this i should be the index of the file of the same fieldname not all files
                else file.meta = meta
            }
            file.user = msg$.principle?.sub

            const tmp = file.path
            const path = Path.join(file.destination, file.filename)
            file.path = path

            if (fs.existsSync(path)) fs.unlinkSync(path)

            //mv file from tmp to path
            try { fs.renameSync(tmp, Path.join(__dirname, path)) }
            catch (err) {
                logger.error(err)
            } //TODO how error should be handled

            //maybe error should be reverted
            await this.storageService.saveToDb(file, msg$.principle)
        }

        return msg$
    }


    private async _uploadBase64(path: string, user: Principle, files: (File & { content?: string })[], overwrite: boolean) {

        const separator = '/'
        for (let i = 0; i < files.length; i++) {
            const f = files[i] as any

            const segments = path.replace(/\\/g, '/').split(separator).filter(s => s)
            const filename = f.filename
            const ext = Path.extname(filename)

            f._id = new mongoose.Types.ObjectId()
            f.originalname = filename
            f.filename = f._id + ext

            const destination: string = segments.join(separator)
            f.destination = destination
            const targetPath = Path.join(__dirname, destination)
            if (!fs.existsSync(targetPath)) makeDir(destination)

            f.path = Path.join(destination, f.filename)

            const buffer = Buffer.from((f.content, 'base64'))
            f.size = buffer.length
            f.encoding = 'utf8'
            //f.mimetype //TODO

            try { await this.writeFile(Path.join(targetPath, f.filename), buffer) }
            catch (error) { throw new HttpException('Error', HttpStatus.BAD_REQUEST) }

            delete f.content
            await this.storageService.saveToDb(f, user)
        }
        return files

    }

    writeFile(path: any, data: any, options?: WriteFileOptions): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(path, data, options || null, (err) => {
                if (err) reject(err)
                else resolve()
            })
        })
    }

    _path(path: string) {
        return decodeURIComponent(path).split('/').filter(s => s).join('/')
    }

    @EndPoint({ http: { method: 'DELETE', path: '**' }, cmd: 'storage/delete', operation: 'delete' })
    @Authorize({ by: 'role', value: 'super-admin' })
    async delete(@Message() msg: IncomingMessage) {

        const { access, rule, source, action } = this.authorizeService.authorize(msg, 'delete')
        if (access === 'deny') throw new HttpException({ rule, action, source, q: msg.query }, HttpStatus.FORBIDDEN)

        await this.storageService.delete(msg.path, msg.principle)

    }

    @EndPoint({ http: { method: 'GET', path: '**' }, operation: 'read', cmd: 'storage/read' })
    @Authorize({ by: 'role', value: 'super-admin' })
    async download(@Message() msg: IncomingMessage, @Res() res: Response) {

        const { access, rule, source, action } = this.authorizeService.authorize(msg, 'read')
        if (access === 'deny') throw new HttpException({ rule, action, source, q: msg.query }, HttpStatus.FORBIDDEN)


        if (!isFile(msg.path)) throw new HttpException("File not found", HttpStatus.NOT_FOUND)

        const fname = Path.basename(msg.path)

        const ext = Path.extname(msg.path)
        let file: File | undefined = undefined
        const decodedPath = decodeURIComponent(msg.path).split('/').filter(x => x.trim().length).join('/')
        try {
            const _id = fname.substring(0, fname.length - ext.length)
            file = await this.data.get<File>(`storage/${_id}`)
            if (!file) {
                logger.error(`Could not find any file with id: ${_id}`)
                throw new HttpException("File not found", HttpStatus.NOT_FOUND)
            }
        }
        catch (err) {
            logger.error(`Cast to ObjectId failed. ${msg.path}`)
            const files = await this.data.get<File[]>('storage', { path: decodedPath })
            file = files.shift()
        }

        const fullPath = Path.join(__dirname, file!.path)
        if (!file || !fs.existsSync(fullPath)) throw new HttpException('NOT_FOUND', HttpStatus.NOT_FOUND)

        if (msg.query!.view === '1') {
            const img = await this.imageService.get(__dirname, file!.path, msg.query!);
            if (!img) return res.status(404).send('');
            res.type(`image/${msg.query!.format || 'png'}`);
            img.pipe(res);
        }
        else {
            // const stream = fs.createReadStream(Path.join(__dirname, file.path))
            res.setHeader("Access-Control-Expose-Headers", "Content-Disposition")
            res.download(fullPath, file!.originalname)
        }
    }
}
}