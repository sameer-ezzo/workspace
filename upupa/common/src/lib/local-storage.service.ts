import { PLATFORM_ID, inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { isPlatformBrowser, } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class LocalStorageService {
    private readonly platformId = inject(PLATFORM_ID)
    private readonly storage: ILocalStorage = isPlatformBrowser(this.platformId) ? localStorage : new LocalStorage()

    getItem = (key: string) => this.storage.getItem(key)
    setItem = (key: string, value: string) => this.storage.setItem(key, value)
    removeItem = (key: string) => this.storage.removeItem(key)
    clear = () => this.storage.clear()
    key = (index: number) => this.storage.key(index)
    length = () => this.storage.length
}

export interface ILocalStorage {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
    removeItem(key: string): void
    clear(): void
    key(index: number): string | null
    length: number
}

class LocalStorage {
    private readonly _storage = new Map<string, string>()
    getItem = (key: string) => this._storage.get(key)
    setItem = (key: string, value: string) => this._storage.set(key, value)
    removeItem = (key: string) => this._storage.delete(key)
    clear = () => this._storage.clear()
    key = (index: number) => Array.from(this._storage.keys())[index]
    get length() { return this._storage.size }
}