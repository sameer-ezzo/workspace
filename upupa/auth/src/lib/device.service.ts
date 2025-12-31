import { HttpClient } from "@angular/common/http";
import { Injectable, inject, DOCUMENT } from "@angular/core";

import { loadScript, randomString, UserDevice } from "@noah-ark/common";

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
declare let platform: Platform & any;

@Injectable({
    providedIn: "root",
})
export class DeviceService {
    private readonly options = inject(AUTH_OPTIONS);
    readonly baseUrl = this.options.baseUrl;
    readonly http = inject(HttpClient);
    private readonly doc = inject(DOCUMENT);

    getDeviceId() {
        let id = localStorage.getItem("device");
        if (!id) {
            id = randomString(8);
            localStorage.setItem("device", id);
        }
        return id;
    }

    async getDevice(): Promise<Platform> {
        await loadScript(this.doc, "https://cdnjs.cloudflare.com/ajax/libs/platform/1.3.6/platform.min.js", { defer: true });
        const { name, prerelease, description, layout, manufacturer, os, product, ua, version } = platform;

        const _platform = { name, prerelease, description, layout, manufacturer, os, product, ua, version } as Platform;
        _platform.id = this.getDeviceId();
        _platform.type = "Web";
        return _platform;
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
