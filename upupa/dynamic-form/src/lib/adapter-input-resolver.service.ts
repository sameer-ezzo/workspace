import { Injectable } from '@angular/core';
import { ClientDataSource, DataAdapter, ServerDataSource, TableDataSource, UrlDataSource, DataService } from '@upupa/data';
import { HttpClient } from '@angular/common/http';

import { IFieldInputResolver } from './ifield-input.resolver';
import { ComponentInputs } from './types';




@Injectable({
    providedIn: 'root'
})
export class AdapterInputResolverService implements IFieldInputResolver {
    constructor(private dataService: DataService, private http: HttpClient) { }
    resolve(inputs: ComponentInputs): Promise<ComponentInputs> {
        if (inputs['adapter']) return Promise.resolve(inputs); //if adapter is passed don't do anything

        const _adapter = inputs['_adapter'];
        let dataSource: TableDataSource;
        switch (_adapter.dataSource) {
            case 'server':
                dataSource = new ServerDataSource(this.dataService, _adapter.path, _adapter.selectedColumns);
                break;
            case 'client':
                dataSource = new ClientDataSource(_adapter.data);
                break;
            case 'url':
                dataSource = new UrlDataSource(_adapter.url, this.http);
                break;
        }

        const adapter = new DataAdapter(dataSource, _adapter.keyProperty, _adapter.displayProperty, _adapter.valueProperty, _adapter.imageProperty, _adapter.providerOptions);
        inputs['adapter'] = adapter;
        return Promise.resolve(inputs);
    }
}
