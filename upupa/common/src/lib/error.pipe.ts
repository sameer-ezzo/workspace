import { Pipe, Injectable, ChangeDetectorRef } from "@angular/core";
import { TextPipe, TranslateService } from "@upupa/language";
import { HttpErrorResponse } from "@angular/common/http";

@Injectable({ providedIn: "root" })
export class ErrorService {
    normalize(value: any): { message: string; params?: any } {
        if (!value) return null;
        else if (typeof value === "string") {
            if (value.endsWith("-error")) return { message: value + "-error" };
            else return { message: value + "-error" };
        } else if (value instanceof HttpErrorResponse) {
            if (value.status === 0) return { message: "connection-error" };
            else if (value.status === 401) return { message: "authentication-error" };
            else if (value.status === 403) return { message: "forbidden-error" };
            else if (value.status === 404) return { message: "not-found-error" };
            else if (value.status >= 400 && value.status <= 499) return value.error || { message: "request-error" };
            else if (value.status >= 500 && value.status <= 599) return value.error || { message: "server-error" };
            else if (value.status >= 200 && value.status <= 299) return { message: value.message }; //probably parsing error
        } else {
            //generic object (form error)
            const keys = Object.keys(value);
            const k = keys[0];
            const v = value[k];
            return { message: k + "-error", params: v };
        }
        return null;
    }
}

