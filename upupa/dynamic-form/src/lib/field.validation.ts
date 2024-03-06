import { HttpClient } from "@angular/common/http";
import { AuthService } from "@upupa/auth";
import { DataService } from "@upupa/data";
import { firstValueFrom } from "rxjs";
import { ValidationTask, ValidationTaskResult } from "./types/types";



export function mergeValidationTasks(...tasks: ValidationTask[]): ValidationTask {
    const parentTask: any = {
        name: '',
        state: 'send', error: '',
        task: async (name, value) => {
            for (let i = 0; i < tasks.length; i++) {
                const t = tasks[i];
                const result = await t.task(name, value);
                parentTask.name = t.name;
                if (result === null || result === true) continue;
                return result
            }
            return false
        }
    }
    return parentTask;
}

export function httpValidationTask(task: string, http: HttpClient, url: string, codeUrl?: string): ValidationTask {
    return {
        name: task, state: 'send', error: '',
        task: async (name, value) => {
            const result = await firstValueFrom(http.post<ValidationTaskResult>(url, { name, value }));
            if (result['code']) result['code'] = httpValidationTask(task, http, codeUrl);
            return result
        }
    }
}

export function sendVerificationCodeTask(task: string, auth: AuthService, what: string = 'email'): ValidationTask {
    const name = ''
    return {
        name, state: 'send', error: '',
        task: async (name, value) => {
            let sentResult: boolean;
            try { sentResult = await auth.sendVerificationCode(what, value); }
            catch (error) {
                if (error.error.msg === 'ALREADY_SENT') sentResult = true;
                else return error.error;
            }
            if (sentResult) return { code: submitVerificationCodeTask(task, auth, what) }
            else return false;
        }
    }
}

export function submitVerificationCodeTask(task: string, auth: AuthService, what: string = 'email'): ValidationTask {
    return {
        name: task, state: 'send', error: '',
        task: async (name, value) => {
            try {
                const result = await auth.verify(what, { type: 'code', token: value.code, value: value.value });
                if (result.token) return result;
                else return true;
            }
            catch (error) { return error.error; }
        }
    }
}

export function uniqueValidationTask(task: string, data: DataService, collection: string, propertyName?: string): ValidationTask {
    return {
        name: task, state: 'send', error: '',
        task: async (name, value) => {
            try {
                const result = await firstValueFrom(data.get<any[]>(`/${collection}`, { [propertyName ?? name]: value }));
                return result.length === 0
            }
            catch (error) { return false; }
        }
    }
}