import { makeEnvironmentProviders, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialogModule } from "@angular/material/dialog";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatTabsModule } from "@angular/material/tabs";
import { CommonModule, DOCUMENT } from "@angular/common";
import { UploadService } from "./upload.service";
import { UploadClient } from "./upload.client";
import { STORAGE_BASE } from "./di.token";
import { FileSizePipe } from "./file-size.pipe";
import { MatTableModule } from "@angular/material/table";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { UtilsModule } from "@upupa/common";

function defaultUploadBase(baseUrl: string) {
    return () => {
        const doc = inject(DOCUMENT);
        baseUrl = (baseUrl.length ? baseUrl : "/storage").trim().toLocaleLowerCase();
        if (baseUrl.startsWith("http")) return baseUrl;
        const base = doc.location.pathname;
        const url = new URL(baseUrl, base).toString();
        return url;
    };
}

export function provideUpload(baseUrl: string | (() => string)) {
    const opts = typeof baseUrl === "function" ? baseUrl : defaultUploadBase(baseUrl);
    return makeEnvironmentProviders([
        UploadService,
        UploadClient,
        FileSizePipe,
        CommonModule,
        MatIconModule,
        MatTabsModule,
        MatDialogModule,
        MatSidenavModule,
        MatTableModule,
        MatCardModule,
        MatMenuModule,
        UtilsModule,
        MatListModule,
        MatButtonModule,
        MatExpansionModule,
        MatTableModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatProgressBarModule,
        {
            provide: STORAGE_BASE,
            useFactory: opts as () => string,
        },
    ]);
}
