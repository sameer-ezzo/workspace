import { InjectionToken } from "@angular/core";

export const APIBASE = new InjectionToken<string>('ApiBaseUrl');

export type QueryDescriptor = { [key: string]: any } & { page?: number, per_page?: number, select?: string, sort_by?: string };
export type MetaDataDescriptor = { [name: string]: string } & { ['X-Get']: 'Count' }