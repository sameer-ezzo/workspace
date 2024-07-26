
import { Controller, HttpException, HttpStatus, Res } from "@nestjs/common"
import { Response } from 'express'
import { DataService, Patch } from "@ss/data"
import { Authorize, AuthorizeService } from "@ss/rules"
import type { IncomingMessage, Rule } from "@noah-ark/common"
import { EndPoint, Message } from "@ss/common"
import ObjectToCSV from 'object-to-csv'
import { MongoError } from "mongodb"
import { logger } from "@ss/common"

const baseUrl = '/api'

export function provideApiRulesFromPaths(paths: string[]): Rule[] {
    const operations = ['Create', 'Read', 'Update', 'Patch', 'Delete', 'Export']
    const makeRule = (p: string): Rule => {
        return {
            path: p,
            name: p,
            builtIn: true,
            ruleSource: "code",
            actions: operations.map(operation => {
                return {
                    [operation]: [{
                        "access": "grant",
                        "by": "role",
                        "builtIn": true,
                        "value": "super-admin",
                        "name": operation,
                        "action": operation,
                        "rule": p

                    }]
                }
            }).reduce((a, b) => ({ ...a, ...b }), {})
        } as Rule
    }
    return paths.map(path => makeRule(`/api/${path}`)) as Rule[]
}
@Controller('api')
export class ApiController {

    constructor(private authorizationService: AuthorizeService, private dataService: DataService) { }

    @EndPoint({ http: { method: 'POST', path: '**' }, operation: 'Create' })
    @Authorize({ by: 'role', value: 'super-admin' })
    public async post(@Message() msg: IncomingMessage) {

        const { path, q } = _query(msg.path, msg.query, baseUrl)
        const newData = msg.payload
        const principle = msg.principle

        try {

            const result = await this.dataService.post(path, newData, principle)
            return result
        } catch (error) {
            throw this._error(error)
        }
    }

    @EndPoint({ http: { method: 'GET', path: '**' }, operation: 'Read' })
    @Authorize({ by: 'role', value: 'super-admin' })
    public async agg(@Message() msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl)

        const data = await this.dataService.agg(path, false, ...q)
        const total = await this.dataService.count(path, ...q) //TODO use count based on pipeline api
        const result = { data, total, query: q }
        return result
    }

    

    @EndPoint({ http: { method: 'PUT', path: '**' }, operation: 'Update' })
    @Authorize({ by: 'role', value: 'super-admin' })
    public async put(@Message() msg: IncomingMessage) {

        const { path, q } = _query(msg.path, msg.query, baseUrl)
        const doc = msg.payload
        const principle = msg.principle

        const segments = path.split("/").filter(s => s)
        if (segments.length < 2) throw new HttpException('InvalidDocumentPath', HttpStatus.BAD_REQUEST)

        segments.shift()
        segments.shift()
        const patches = this.dataService.getPatches('/' + segments.join('/'), doc)

        const oldData = await this.dataService.get(path)
        const { access, rule, source, action } = this.authorizationService.authorize(msg, 'update', { ...msg, oldData, patches })
        if (access === 'deny') throw new HttpException({ rule, source, action, q: msg.query }, HttpStatus.FORBIDDEN)

        try {
            const result = await this.dataService.put(path, doc, principle)
            return result
        } catch (error) {
            throw this._error(error)
        }
    }

    @EndPoint({ http: { method: 'PATCH', path: '**' }, operation: 'Patch' })
    @Authorize({ by: 'role', value: 'super-admin' })
    public async patch(@Message() msg: IncomingMessage) {

        const { path, q } = _query(msg.path, msg.query, baseUrl)
        const patches = <Patch[]>msg.payload //req.body
        const principle = msg.principle//(<any>req).user

        const segments = path.split("/").filter(s => s)
        if (segments.length != 2) {
            throw new HttpException('Invalid_Document_Path', HttpStatus.BAD_REQUEST)
        }


        const oldData = await this.dataService.get(path)


        const { access, rule, source, action } = this.authorizationService.authorize(msg, 'update', { oldData, patches })
        if (access === 'deny') throw new HttpException({ rule, source, action, q: msg.query }, HttpStatus.FORBIDDEN)


        try {
            const result = await this.dataService.patch(path, patches, principle)
            return result
        } catch (error) {
            throw this._error(error)
        }

    }

    @EndPoint({ http: { method: 'DELETE', path: '**' }, operation: 'Delete' })
    @Authorize({ by: 'role', value: 'super-admin' })
    public async delete(@Message() msg: IncomingMessage) {

        const { path, q } = _query(msg.path, msg.query, baseUrl)
        const principle = msg.principle

        const oldData = await this.dataService.get(path)

        const { access, rule, source, action } = this.authorizationService.authorize(msg, 'delete', { oldData })
        if (access === 'deny') throw new HttpException({ rule, source, action, q: msg.query }, HttpStatus.FORBIDDEN)


        try {
            const result = await this.dataService.delete(path, principle)
            return result
        } catch (error) {
            throw this._error(error)
        }
    }


    @EndPoint({ http: { method: 'GET', path: 'export/**' }, operation: 'Export' })
    @Authorize({ by: 'role', value: 'super-admin' })
    public async export(@Message() msg: IncomingMessage, @Res() res: Response) {

        const { path, q } = _query(msg.path, msg.query, '/export' + baseUrl)

        const data: any[] = await this.dataService.agg(path, true, ...q)
        if (data.length === 0) throw new HttpException('NotFound', HttpStatus.NOT_FOUND)

        const firstItem = data[0]
        const keys = Object.keys(firstItem).map(key => { return { key, as: key } })
        const otc = new ObjectToCSV({ data, keys, 'shouldExpandObjects': true })
        const csv = otc.getCSV()

        if (res) {
            res.setHeader('Content-Type', 'application/csv')
            res.setHeader('Content-Disposition', `attachment filename=${path.substring(1)}.csv`)
        }

        return Buffer.from(csv)

    }

    _error(error: any) {
        if (error instanceof MongoError) {
            switch (error.code) {
                case 11000: //duplicate key
                    {
                        const keys = Object.entries(error['keyPattern']).filter(([, v]) => v === 1).map(([k]) => k)
                        return new HttpException({ message: "CONSTRAINT-VIOLATION", type: "UNIQUE", keys }, HttpStatus.INTERNAL_SERVER_ERROR)
                    }
                default: return new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
        else {
            const message = error.message || error
            const stack = error.stack || ''
            logger.error(message, stack)
            return new HttpException({ message }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}


export function _query(path: string, query: any, baseUrl = '') {
    path = decodeURIComponent(path).substring(baseUrl.length)

    //Q
    query = query || {}
    let queryArray: { key: string, value: string }[] = []
    query = Object.keys(query).map(key => { return { key, value: query[key] } })
    query.forEach(x => {
        if (Array.isArray(x.value)) x.value.forEach((y: any) => queryArray.push({ key: x.key, value: y }))
        else queryArray.push(x)
    })
    queryArray = queryArray.map(x => { return { key: decodeURIComponent(x.key), value: decodeURIComponent(x.value) } })

    const q: Record<string, any>[] = queryArray.map(x => { return { [x.key]: x.value } })
    return { path, q }
}