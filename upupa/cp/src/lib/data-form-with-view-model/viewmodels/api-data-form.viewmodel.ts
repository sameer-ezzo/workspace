import { DataService } from '@upupa/data';

export class ApiDataFormViewModel {
    static async onSubmit(ds: DataService, path: string, value: any) {
        if (!path) throw new Error(`Path is required for submitting data form`);
        return await ds.put(path, value);
    }
}
