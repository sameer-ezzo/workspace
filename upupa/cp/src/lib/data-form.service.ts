import { Injectable } from '@angular/core';
import { DynamicFormComponent } from '@upupa/dynamic-form';
import { AuthService } from '@upupa/auth';
import { DataService } from '@upupa/data';
import { HttpClient } from '@angular/common/http';
import { SnackBarService } from '@upupa/common';



@Injectable({ providedIn: 'root' })
export class DataFormService {

    constructor(private auth: AuthService,
        private snack: SnackBarService,
        private ds: DataService,
        private http: HttpClient) { }

    async onSubmit(collection: string, scheme: any, value: any, form?: DynamicFormComponent):
        Promise<{ success?: boolean, fail?: boolean, res?: any, error?: any }> {
        try {

            const val = Object.assign({}, value);
            let res = null;
            const id = val._id;
            delete val._id;

            switch (collection) {
                default:
                    if (!id) {
                        res = await this.ds.post(`/${collection}`, val);
                    }
                    else {
                        res = await this.ds.put(`/${collection}/${id}`, val);
                    }
                    break;
            }

            return { success: true, res }
        } catch (error) {
            console.error(error);
            return { fail: true, error }
        }
    }
}