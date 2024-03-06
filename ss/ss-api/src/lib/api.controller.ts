
import { Controller, HttpException, HttpStatus, Res } from "@nestjs/common"
import { Response } from 'express'
import { DataService, Patch } from "@ss/data"
import { Authorize, AuthorizeService } from "@ss/rules"
import type { IncomingMessage } from "@noah-ark/common"
import { EndPoint, Message } from "@ss/common"
import ObjectToCSV from 'object-to-csv'
import { MongoError } from "mongodb"
const baseUrl = '/api'


const GET_COMMAND = "api/get"
const CREATE_COMMAND = "api/create"
const UPDATE_COMMAND = "api/update"
const PATCH_COMMAND = "api/patch"
const DELETE_COMMAND = "api/delete"

@Controller('api')
export class ApiController {

    constructor(private authorizationService: AuthorizeService, private dataService: DataService) { }

    @EndPoint({ http: { method: 'POST', path: '**' }, cmd: CREATE_COMMAND, operation: 'create' })
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


    @EndPoint({ http: { method: 'GET', path: 'v2/**' }, cmd: GET_COMMAND, operation: 'read', path: '**' })
    @Authorize({ by: 'role', value: 'super-admin' })
    public async agg(@Message() msg: IncomingMessage) {
        const { path, q } = msg.path.indexOf('api/v2') > -1 ? _query(msg.path, msg.query, '/v2' + baseUrl) : _query(msg.path, msg.query, baseUrl)

        const data = await this.dataService.agg(path, false, ...q)
        const total = await this.dataService.count(path, ...q) //TODO use count based on pipeline api
        const result = { data, total, query: q }
        return result

    }

    @EndPoint({ http: { method: 'GET', path: '**' }, operation: 'read' })
    @Authorize({ by: 'role', value: 'super-admin' })
    public async get(@Message() msg: IncomingMessage, @Res() res: Response) {
        switch (msg.query.function) {
            case 'COUNT': return res.send(await this._count(msg))
            default: return res.send(await this._select(msg, res))
        }
    }

    private async _select(msg: IncomingMessage, res: Response) {
        const { path, q } = _query(msg.path, msg.query, baseUrl)

        const authZ1 = this.authorizationService.authorize(msg, 'read')
        if (authZ1.access === 'deny') throw new HttpException({ ...authZ1, q: msg.query }, HttpStatus.FORBIDDEN)

        let result = await this.dataService.get(path, ...q)

        const authZ2 = this.authorizationService.authorize(msg, 'read', { data: result })
        if (authZ2.access === 'deny') throw new HttpException({ ...authZ2, q: msg.query }, HttpStatus.FORBIDDEN)

        if (!result) throw new HttpException('NotFound', HttpStatus.NOT_FOUND)
        else {
            if (Array.isArray(result)) {
                const count = await this.dataService.count(path, ...q)
                if (res) res.header('X-Get-Count', count + '')
                else result = { data: result, total: count, query: q }
            }
            return result
        }

    }

    private async _count(msg: IncomingMessage) {
        const { path, q } = _query(msg.path, msg.query, baseUrl)

        const { access, rule, source, action } = this.authorizationService.authorize(msg, 'read')
        if (access === 'deny') throw new HttpException({ rule, source, action, q: msg.query }, HttpStatus.FORBIDDEN)

        const count = await this.dataService.count(path, ...q)
        return count
    }





    @EndPoint({ http: { method: 'PUT', path: '**' }, cmd: UPDATE_COMMAND, operation: 'update' })
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

    @EndPoint({ http: { method: 'PATCH', path: '**' }, cmd: PATCH_COMMAND, operation: 'update' })
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

    @EndPoint({ http: { method: 'DELETE', path: '**' }, cmd: DELETE_COMMAND, operation: 'delete' })
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


    @EndPoint({ http: { method: 'GET', path: 'v2/export/**' }, operation: 'export', path: 'export/**' })
    @Authorize({ by: 'role', value: 'super-admin' })
    public async export(@Message() msg: IncomingMessage, @Res() res: Response) {

        const { path, q } = _query(msg.path, msg.query, '/v2/export' + baseUrl)

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
        else return new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
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