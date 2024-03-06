
export class DbConnectionOptions {
    prefix?: string

    allowReadAnonymous = process.env.allowReadAnonymous === 'true' ?? true
    allowWriteAnonymous = process.env.allowWriteAnonymous === 'true' ?? false

    //MONGO CONNECTION OPTIONS
    user?: string
    pass?: string
    bufferCommands?: boolean
    autoIndex?= true
    autoCreate?= false
}




