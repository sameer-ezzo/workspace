import { DataService } from '@upupa/data';

export class ApiDataFormViewModel {
    static async post(ds: DataService, path: string, value: any) {
        if (!path) throw new Error(`Path is required for submitting data form`);
        return await ds.post(path, value);
    }
    static async put(ds: DataService, path: string, value: any) {
        if (!path) throw new Error(`Path is required for submitting data form`);
        return await ds.put(path, value);
    }

    static async onSubmit(ds: DataService, collection: string, value: any) {
        if (value._id) return await ApiDataFormViewModel.put(ds, collection, value);
        return await ds.put(`${collection}/${value._id}`, value);
    }
}
