import { HttpClient } from "@angular/common/http";
import { Injectable, Inject } from "@angular/core";

import { randomString, UserDevice } from "@noah-ark/common";

import { AUTH_BASE_TOKEN } from "./di.token";
import { firstValueFrom } from "rxjs";

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
    constructor(
        @Inject(AUTH_BASE_TOKEN) public readonly baseUrl: string,
        public readonly http: HttpClient,
    ) {}

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
