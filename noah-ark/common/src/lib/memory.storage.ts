import { StorageBase } from "./storage.base";


export class MemoryStorage implements StorageBase {
    GET(key: string): Promise<string> {
        return this.storage[key];
    }
    async SET(key: string, item: string): Promise<boolean> {
        this.storage[key] = item;
        return true;
    }

    JSON<T>(key: string): Promise<T>;
    JSON<T>(key: string, obj: T): Promise<void>;
    async JSON<T>(key: any, obj?: any): Promise<void | T> {
        if (obj) this.storage[key] = obj;
        else return this.storage[key];
    }
    async DELETE(key: string): Promise<boolean> {
        if (this.storage[key] !== undefined) {
            delete this.storage[key];
            return true;
        }
        return false;
    }
    async KEYS(): Promise<string[]> {
        return Object.keys(this.storage);
    }


    public readonly storage: Record<string, any> = {};


}