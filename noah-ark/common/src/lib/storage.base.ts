export interface StorageBase {

    GET(key: string): Promise<string>;
    SET(key: string, item: string): Promise<boolean>;
    JSON<T>(key: string): Promise<T>;
    JSON<T>(key: string, obj: T, ttl?: number): Promise<void>;
    DELETE(key: string): Promise<boolean>;
    KEYS(filter?: string): Promise<string[]>;
    JSONSET?<T>(key: string, path: string, obj: T, ttl?: number): Promise<void>;
    JSONGET?<T>(key: string, path: string): Promise<T>;
}
