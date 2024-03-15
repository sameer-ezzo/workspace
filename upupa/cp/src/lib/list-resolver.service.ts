import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ServerDataSource } from '@upupa/data';
import { DataListResolverResult } from '../types';
import { ScaffoldingService } from './scaffolding.service';


@Injectable({
    providedIn: 'root'
})
export class DataListResolverService {

    collection: string = '';
    snapshot: ActivatedRouteSnapshot | undefined;
    item: any;
    focusedItem: any;
    listProvider: ServerDataSource<any> | undefined;

    constructor(public scaffolder: ScaffoldingService) { }


    resolve(collection: string, view: string, queryParams: any) {
        const path = '/' + [view, collection].filter(x => x).join('/');
        return this.scaffolder.scaffold(path, { type: 'list', query: queryParams }) as Promise<DataListResolverResult>;
    }

}
