import { DataService } from "@ss/data"
import { HttpException, HttpStatus, Injectable } from "@nestjs/common"
import * as Path from "path"
import * as os from "os"

//file should be reachable by id (path independent)
//logs (save hostory)
//save meta data for file

//files should be queriable (search+filtering+sorinting)
//detect orphans (file in db not in disk or vice versa) / cleaning job


// import mongoose from "mongoose"
// import { rejects } from "assert"

import { execSync } from 'child_process'
import { PostedFile, File } from "@noah-ark/common"
import fileSchema from "./schema"
import mongoose from "mongoose"
import { join } from "path"
import { createWriteStream, existsSync, mkdirSync, opendirSync, renameSync, statSync } from "fs"
import { logger } from "@ss/common"


const separator = '/'
export function makeDir(dir: string) {
    dir = dir.replace(/\\/g, '/')
    if (existsSync(join(__dirname, dir))) return

    const segments = dir.split(separator)
    for (let i = 1; i < segments.length; i++) {
        segments[i] = segments[i - 1] + separator + segments[i]
    }
    for (let i = 0; i < segments.length; i++) {
        const dir = join(__dirname, segments[i])
        if (!dir || dir === '.' || dir === '..') continue
        if (!existsSync(dir)) mkdirSync(dir)
    }
}




export function mv(oldpath:string, newpath:string) {
    execSync(`mv "${oldpath}" "${newpath}"`)
}


export function isDir(path: string): boolean {
    try {
        opendirSync(join(__dirname, path))
        return true
    }
    catch (error) { return false }
}
export function isFile(path: string) {
    return existsSync(join(__dirname, path)) && !isDir(path)
}

export function toObjectId(id: string): mongoose.Types.ObjectId | undefined {
    try {
        return mongoose.Types.ObjectId.createFromHexString(id) as mongoose.Types.ObjectId
    } catch (error) {
        return undefined
    }
}

export async function saveStreamToTmp(path: string, file: PostedFile): Promise<File> {
    return new Promise<File>((resolve, reject) => {


        const segments = path.replace(/\\/g, '/').split(separator).filter(s => s)
        if(segments.length === 0) reject(`Invalid path ${path}`)
        let filename = segments.pop()!

        let ext = Path.extname(filename!) ?? ''
        let _id: string

        if (ext.length > 0) _id = filename.substring(0, filename.length - ext.length)
        else {
            segments.push(filename) //path originally points to dir so put the file name back
            ext = Path.extname(file.originalname)
            _id = file.originalname.substring(file.originalname.length - ext.length)
            if (!toObjectId(_id)) _id = new mongoose.Types.ObjectId().toHexString()
        }

        filename = _id + ext

        const tmp = join(os.tmpdir(), filename)
        const fileStream = file.stream as any
        const ws = createWriteStream(tmp)

        fileStream.on('error', (err: any) => reject({ msg: 'FileStreamError', error: err }))
        fileStream.on('end', () => {
            ws.close()
        })
        ws.on('finish', () => {

            const stats = statSync(tmp)

            const destination = segments.join(separator)
            try { makeDir(destination) }
            catch (err) { reject({ msg: "InvalidOperation:CreateDirectory", error: err }) }

            const { stream, ...filebase } = file
            const result: File = {
                _id,
                destination, filename, path: tmp, size: stats.size, status: 0,
                date: new Date(),
                ...filebase
            }

            resolve(result)
        })
        fileStream.pipe(ws)

    })
}

@Injectable()
export class StorageService {


    constructor(private data: DataService) {
        this.data.addModel('storage', fileSchema).then(() => { })
    }

    async saveToDb(f: File, principle: any) {
        await this.data.put(`/storage/${f._id}`, f, principle)
    }


    async delete(path: string, principle: any) {
        const segments = path.replace(/\\/g, '/').split(separator)
        const filename = segments[segments.length - 1]
        const ext = Path.extname(filename)
        if (!ext) throw new HttpException("InvalidPath", HttpStatus.BAD_REQUEST)
        const _id = filename.substring(0, filename.length - ext.length)

        const doc = await this.data.get<File>(`storage/${_id}`)
        if (!doc) throw new HttpException("No file found", HttpStatus.NOT_FOUND)

        await this.data.delete(`storage/${_id}`, principle)
        const fPath = join(__dirname, doc.path)
        if (!existsSync(fPath)) return
        const trashedDir = join(__dirname, 'storage/_trashed')
        if (!existsSync(trashedDir)) mkdirSync(trashedDir, { recursive: true })

        try {
            renameSync(fPath, join(__dirname, 'storage/_trashed', filename)) //TODO clean-up job
        }
        catch (err) {
            console.error(err)
        }
    }


}