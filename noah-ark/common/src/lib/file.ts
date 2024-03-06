export type PostedFileStream = any//NodeJS.ReadableStream
export type FileBase = { fieldname: string, originalname: string, encoding: string, mimetype: string, meta?: Record<string, unknown> }
export type PostedFile = FileBase & { stream: PostedFileStream }



export type FileRecord = FileBase & {
    destination: string
    filename: string
    path: string

    size: number

    status: number //ok, orphan, ...

    date: Date
    user?: string

    meta?: Record<string, unknown>
}
export type File = FileRecord & { _id: string }
export type FileInfo = File