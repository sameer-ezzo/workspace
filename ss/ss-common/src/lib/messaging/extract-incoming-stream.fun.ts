import Busboy from "busboy"
import { Request, Response } from "express"
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common'

import { ExtractIncomingMessage } from "./extract-incoming-message.fun"
import { IncomingMessageStream, PostedFile, File } from "@noah-ark/common"
import { PostedFileHandler, _onFile, _onField } from "./model"
import * as Path from "path"

const allowedExtensions = process.env['STORAGE_ALLOWED_EXTENSIONS']?.split(',') ?? ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.pdf', '.docx', '.xlsx', '.txt', '.zip', '.7zip', '.7z', '.rtf', '.csv', '.mkv', '.mp4', '.iso', '.tar', '.tar.gz'];


export async function ExtractMessageStream(streamHandler: PostedFileHandler, ctx: ExecutionContext) {
    switch (ctx.getType()) {
        case 'http':
            {
                const req = ctx.switchToHttp().getRequest<Request>()


                return new Promise<IncomingMessageStream>((resolve, reject) => {

                    const msg = ExtractIncomingMessage(ctx)
                    const streams: Promise<File>[] = []

                    let resolved = false
                    const resolver = () => {
                        if (resolved) return
                        resolved = true
                        resolve({ ...msg, streams } as unknown as IncomingMessageStream)
                    }

                    const contentType = req.get('content-type')?.toLocaleLowerCase()
                    // if (contentType === 'application/x-www-form-urlencoded' || contentType === 'multipart/form-data') {
                    // Busboy could not handle these content types so I changed the check strategy to exclude the application/json which is used in Base64 upload.

                    if (contentType !== 'application/json') {
                        const busboy = Busboy({ headers: req.headers })
                        busboy.on('file', async (field, file, info) => {
                            const { filename, encoding, mimeType } = info
                            const extension = Path.extname(filename).toLocaleLowerCase()
                            const destination = req.path.split('/').filter(s => s).join()
                            const path = Path.join(destination, filename)

                            if (path.indexOf('..') > -1 || !allowedExtensions.includes(extension)) {
                                const incoming = ctx.switchToHttp().getRequest<Response>() as any
                                const res = incoming.res
                                file.destroy()
                                res.status(403).send({ message: "Invalid path or file extension", path, extension })
                                res.end();
                                req.socket.destroy();

                                throw new HttpException("Invalid path or file extension", HttpStatus.FORBIDDEN);
                            }

                            const postedFile = { fieldname: field, stream: file, originalname: filename, encoding, mimetype: mimeType } as PostedFile
                            streams.push(_onFile(postedFile, ctx, streamHandler))
                        })
                        busboy.on('field', (fieldname, val, info) => _onField(msg.payload, fieldname, val))
                        busboy.on('error', error => {
                            resolved = true
                            reject(error)
                        })
                        busboy.on('finish', async () => {
                            await resolver()
                        })

                        busboy.on('close', async () => {
                            if (resolved) return
                            resolved = true
                            reject('Closed')
                        })
                        req.pipe(busboy)
                    }
                })
            }

        //case 'rpc': return ctx.switchToRpc().getData() as IncomingMessage
        //case 'ws': return ctx.switchToWs().getData() as IncomingMessage
        default: throw new HttpException("UNSUPPORTED_TRANSPORT", HttpStatus.BAD_GATEWAY)
    }
}
