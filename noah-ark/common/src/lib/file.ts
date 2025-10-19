export type PostedFileStream = any; //NodeJS.ReadableStream
export type FileBase<M = Record<string, unknown>> = { fieldname: string; originalname: string; encoding: string; mimetype: string; meta?: M };
export type PostedFile = Omit<FileBase, "fieldname"> & { stream: PostedFileStream; fieldname?: string };

export type FileRecord<M = Record<string, unknown>> = FileBase<M> & {
    destination: string;
    filename: string;
    path: string;

    size: number;

    status: number; //ok, orphan, ...

    date: Date;
    user?: string;
};
export type File<M = Record<string, unknown>> = FileRecord<M> & { _id: string };
export type FileInfo<M = Record<string, unknown>> = File<M>;
