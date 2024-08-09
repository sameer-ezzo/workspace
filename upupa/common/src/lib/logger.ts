// logger levels array
const LOG_LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'] as const
export type LogLevel = typeof LOG_LEVELS[number]
export type LoggerOptions = { title?: string, logLevel: LogLevel }

export class Logger {

    #enabledLevels = LOG_LEVELS.reduce((acc, level) => {
        acc[level] = LOG_LEVELS.indexOf(level) <= LOG_LEVELS.indexOf('ERROR')
        return acc
    }, {} as Record<LogLevel, boolean>)



    constructor(private options: LoggerOptions) {
        const enabledLevel = LOG_LEVELS.findIndex(l => l === this.options.logLevel)
        this.#enabledLevels = LOG_LEVELS.reduce((acc, level) => {
            acc[level] = LOG_LEVELS.indexOf(level) <= enabledLevel
            return acc
        }, {} as Record<LogLevel, boolean>)
    }

    log(title: string, style: { background: string, color: string }, ...terms: any[]) {
        if (!this.#enabledLevels.INFO) return
        style = style || { background: 'black', color: 'white' }
        const background = style.background || 'black'
        const color = style.color || 'white'
        title = title || new Date().toISOString()
        console.log(`%c ${title}`, `background: ${background} color: ${color}`, ...terms)
    }

    warn(title: string, style: { background: string, color: string }, ...terms: any[]) {
        if (!this.#enabledLevels.INFO) return
        style = style || { background: 'black', color: 'yellow' }
        const background = style.background || 'black'
        const color = style.color || 'yellow'
        title = title || new Date().toISOString()
        console.warn(`%c ${title}`, `background: ${background} color: ${color}`, ...terms)
    }
    error(title: string, style: { background: string, color: string }, ...terms: any[]) {
        if (!this.#enabledLevels.INFO) return
        style = style || { background: 'black', color: 'red' }
        const background = style.background || 'black'
        const color = style.color || 'white'
        title = title || new Date().toISOString()
        console.error(`%c ${title}`, `background: ${background} color: ${color}`, ...terms)
    }
    debug(title: string, style: { background: string, color: string }, ...terms: any[]) {
        if (!this.#enabledLevels.DEBUG) return
        style = style || { background: 'yellow', color: 'black' }
        const background = style.background || 'yellow'
        const color = style.color || 'black'
        title = title || new Date().toISOString()
        console.debug(`%c ${title}`, `background: ${background} color: ${color}`, ...terms)
    }

    trace(title: string, style: { background: string, color: string }, ...terms: any[]) {
        if (!this.#enabledLevels.TRACE) return
        style = style || { background: 'yellow', color: 'black' }
        const background = style.background || 'yellow'
        const color = style.color || 'black'
        title = title || new Date().toISOString()
        console.trace(`%c ${title}`, `background: ${background} color: ${color}`, ...terms)
    }
}

export function loggerFactory(options: LoggerOptions = { logLevel: 'INFO' }) {
    return new Logger(options)
}

export const logger = loggerFactory()