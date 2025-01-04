import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";

import { randomString, UserDevice } from "@noah-ark/common";

import { firstValueFrom } from "rxjs";
import { AUTH_OPTIONS } from "./di.token";

export type Platform = {
    id: string;
    type: string;

    name: string;
    prerelease: string;
    description: string;
    layout: string;
    manufacturer: string;
    os: string;
    product: string;
    ua: string;
    version: string;
};
@Injectable({
    providedIn: "root",
})
export class DeviceService {
    private readonly options = inject(AUTH_OPTIONS);
    readonly baseUrl = this.options.base_url;
    readonly http = inject(HttpClient);

    getDeviceId() {
        let id = localStorage.getItem("device");
        if (!id) {
            id = randomString(8);
            localStorage.setItem("device", id);
        }
        return id;
    }

    async getDevice(): Promise<Platform> {
        const { name, prerelease, description, layout, manufacturer, os, product, ua, version } = await import("platform").then((p) => p);
        const platform = { name, prerelease, description, layout, manufacturer, os, product, ua, version } as Platform;
        platform.id = this.getDeviceId();
        platform.type = "Web";
        return platform;
    }

    updateDeviceInfo(device: Partial<UserDevice>) {
        if (!device.id) device.id = localStorage.getItem("device");
        const rx = this.http.post(`${this.baseUrl}/device`, device);
        return firstValueFrom(rx);
    }

    async removeDevice(deiceId: string = localStorage.getItem("device")) {
        const rx = this.http.delete(`${this.baseUrl}/device?id=${deiceId}`);
        return firstValueFrom(rx);
    }
}
