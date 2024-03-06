import { Injectable, Optional } from "@angular/core";
import { DataResult } from "./model";

export class CacheItem<T = any> {
    timestamp: Date;
    value: T;
}

@Injectable()
export class CacheStore<K = any> {
    protected dictionary: { [key: string]: CacheItem } = {};

    keys(): string[] { return Object.keys(this.dictionary); }

    item<T = K>(key: string): CacheItem<T> { return this.dictionary[key]; }
    items<T = K>(): CacheItem<T>[] { return Object.keys(this.dictionary).map(k => this.dictionary[k]); }
    mapItems<T = K>(): { key: string, item: CacheItem<T> }[] { return Object.keys(this.dictionary).map(key => { return { key, item: this.dictionary[key] } }) }

    get<T = K>(key: string): T { 
        this.refresh(key);
        return this.dictionary[key]?.value;
    }
    values<T = K>(): T[] { return Object.keys(this.dictionary).map(k => this.dictionary[k].value); }
    map<T = K>(): { key: string, value: T }[] { return Object.keys(this.dictionary).map(key => { return { key, value: this.dictionary[key].value } }) }

    set<T = K>(key: string, value: T): T { this.dictionary[key] = { value, timestamp: new Date() }; return value; }
    remove(key: string) { if (this.dictionary[key] != undefined) delete this.dictionary[key]; }
    refresh(key: string) {        
        let x = this.dictionary[key];
        if (x) x.timestamp = new Date();
    }
    clear() { this.dictionary = {} }
}