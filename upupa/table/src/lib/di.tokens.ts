import { InjectionToken } from "@angular/core";

export class DataTableOptions{
    enableLogs: boolean = false;
} 
export const DATA_TABLE_OPTIONS = new InjectionToken<DataTableOptions>('Data Table Options');