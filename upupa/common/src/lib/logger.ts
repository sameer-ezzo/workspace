// logger levels array
const LOG_LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'] as const
export type LogLevel = typeof LOG_LEVELS[number]
export type LoggerOptions = {
    logLevel: LogLevel
}

export class Logger {
    // static l = {['']}
    constructor(private options: LoggerOptions) {
        // generate Map for log levels and set enabled levels
    }
    // based on log level, log the message
    error(...terms: any[]) {
        if (LOG_LEVELS.indexOf(this.options.logLevel) >= LOG_LEVELS.indexOf('ERROR')) {
            console.error(...terms)
        }
    }
    static log(title: string, style: { background: string, color: string }, ...terms: any[]) {
        console.log(`%c ${title}`, `background: ${style?.background} color: ${style.color}`, ...terms)
    }
}

// export function loggerFactory(options: LoggerOptions = { logLevel: 'ERROR' }) {
//     return new Logger(options: LOG_OPTIONS)
// }

// export default logger = new Logger(options: LOG_OPTIONS)