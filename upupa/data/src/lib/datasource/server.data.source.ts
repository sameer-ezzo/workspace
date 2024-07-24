import { ReplaySubject, Observable, of, } from "rxjs"
import { catchError, debounceTime, map, switchMap } from "rxjs/operators"
import { TableDataSource, Term } from "./model"
import { PageEvent } from "@angular/material/paginator"
import { DataService } from "../data.service"


export class ServerDataSource<T = any> extends TableDataSource<T> {


    readonly allDataLoaded = false

    data: T[]
    readonly src$ = new ReplaySubject<Observable<T[]>>(1)
    readonly data$ = this.src$.pipe(debounceTime(200), switchMap(src => src.pipe(map(x => x)))) //everytime the src is changed switch to the new one



    constructor(private readonly dataService: DataService, public readonly path: string, private readonly selectedColumns: (keyof T)[]) {
        super()
    }


    _evalTerm(term: Term<T>, value: string) {
        switch (term.type) {
            case 'like': return `*${value}*`
            case 'number': return isNaN(+value) ? '' : +value
            case 'boolean': return value === 'true'
            case 'date': return new Date(value)
            default: return value
        }
    }

    refresh(): Observable<T[]> {

        const filter = this.filter
        const sort = this.sort
        const page = this.page

        const query: any = {}
        const term: any = (filter && filter.terms?.length) ? filter.terms.join(" ") : ''
        if (term) {
            const termsFields = this.terms.slice()
            if (termsFields.length) {
                const k = termsFields.shift()
                const v = this._evalTerm(k, term)
                if (v) query[k.field] = v
                if (termsFields.length) query[k.field] += '|' + termsFields.map(f => `${String(f.field)}=${this._evalTerm(f, term)}`).join("|")
            }
        }
        Object.keys(filter ?? {}).forEach(k => query[k] = filter[k])
        delete query.terms

        query.page = page && page.pageIndex ? Math.max(0, page.pageIndex) + 1 : 1
        query.per_page = page && page.pageSize ? Math.max(0, page.pageSize) : 25

        if (sort?.active) query.sort_by = `${sort.active},${sort.direction}`

        if (this.selectedColumns?.length > 0) query.select = this.selectedColumns.join(',')

        const src = this.v2Get(this.path, page, query)

        this.src$.next(src)
        return this.data$
    }

    v2Get(path: string, page: Partial<PageEvent>, query: any): Observable<T[]> {
        return this.dataService.get<any>(path, query).pipe(
            catchError(() => of({ total: 0, data: [], query })), //TODO proper handling to errors comming from data service
            map(x => {
                page.length = x.total
                this.data = x.data
                return x.data
            }))
    }
    v1Get(path: string, page: Partial<PageEvent>, query: any): Observable<T[]> {
        return this.dataService.fetch<T[]>(path, query, { "X-Get": 'Count' })
            .pipe(catchError(() => of({ meta: { count: 0 }, data: [], query })), //TODO proper handling to errors comming from data service
                map(x => {
                    page.length = x.meta === null || isNaN(+x.meta?.count) ? 0 : +x.meta.count
                    this.data = x.data
                    return x.data
                }))
    }

    destroy?() { }

    override getItems(value: (string | number | symbol)[], key: string | number | symbol): Observable<T[]> {
        return value?.length > 0 ? (this.path.includes('v2/') ?
            this.v2Get(this.path, {}, { [key]: `{in}${value.join(',')}` }) :
            this.v1Get(this.path, {}, { [key]: `{in}${value.join(',')}` })) : of([])
    }
}


