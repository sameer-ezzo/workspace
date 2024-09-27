import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PostedFile, File } from '@noah-ark/common';
import { JsonPointer } from '@noah-ark/json-patch';
import { ExtractIncomingMessage } from './extract-incoming-message.fun';
import { ExtractMessageStream } from './extract-incoming-stream.fun';

export type PostedFileHandler = (
    file: PostedFile,
    ctx: ExecutionContext,
) => Promise<File>;

export const Message = createParamDecorator(
    (_data: void, ctx: ExecutionContext) => ExtractIncomingMessage(ctx),
);
export const MessageStream = createParamDecorator(
    async (streamHandler: PostedFileHandler, ctx: ExecutionContext) =>
        ExtractMessageStream(streamHandler, ctx),
);

export async function _onFile(
    postedFile: PostedFile,
    ctx: any,
    streamHandler: PostedFileHandler,
) {
    if (postedFile.fieldname === postedFile.originalname)
        delete postedFile.fieldname;
    const result = await streamHandler(postedFile, ctx);
    return result;
}

export async function _onField(payload: any, fieldname: any, val: any) {
    JsonPointer.set(payload, fieldname, val);
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'ALL';

export type ServiceAnouncement = {
    name: string;
    events: string[];
    commands: string[];
};
