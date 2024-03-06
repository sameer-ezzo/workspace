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


    resolve(snapshot: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

        const collection = snapshot.params['collection'];
        const view = snapshot.params['view'] ?? 'list';


        const path = '/' + [view, collection].filter(x => x).join('/');

        return this.scaffolder.scaffold(path, { type: 'list', query: snapshot.queryParams }) as Promise<DataListResolverResult>;
    }

}
