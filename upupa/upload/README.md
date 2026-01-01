# @upupa/upload

An Angular library providing services and utilities for file uploads.

## Features

*   **Upload Service (`UploadService`):** Handles the core logic of uploading files via HTTP POST requests, likely managing `FormData` and progress tracking.
*   **Upload Client (`UploadClient`):** A higher-level service that simplifies uploads by combining a base storage URL (from configuration) with relative paths.
*   **Progress Tracking:** Provides observables to monitor upload progress (likely via `UploadService`).
*   **File Size Formatting:** Includes a `FileSizePipe` to display file sizes in a human-readable format (e.g., KB, MB, GB).
*   **Clipboard Integration:** Utilities for handling file/image pasting from the clipboard.
*   **Configuration:** Requires a base URL for the backend storage/upload endpoint.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@angular/common/http` for making upload requests.

**Steps:**

1.  Install the library:

    ```bash
    npm install @upupa/upload
    # or
    yarn add @upupa/upload
    ```

2.  **Provide Configuration:** Define the base URL for your storage/upload backend endpoint using the `STORAGE_BASE` token in your application providers.

    ```typescript
    // Example in app.config.ts (standalone)
    import { ApplicationConfig } from '@angular/core';
    import { provideHttpClient } from '@angular/common/http';
    import { STORAGE_BASE } from '@upupa/upload';

    export const appConfig: ApplicationConfig = {
      providers: [
        provideHttpClient(), // Needed for UploadService
        {
          provide: STORAGE_BASE,
          useValue: '/api/storage' // Your base backend endpoint for uploads
        }
        // ... other providers
      ],
    };
    ```

3.  **Import Module/Services:** Import `UploadModule` or inject `UploadClient` / `UploadService` directly where needed.

    ```typescript
    // Example injecting the client service
    import { Component, inject } from '@angular/core';
    import { UploadClient } from '@upupa/upload';

    @Component({ /* ... */ })
    export class MyUploaderComponent {
      private uploadClient = inject(UploadClient);
      // ...
    }
    ```

## Usage

### Using `UploadClient`

Inject `UploadClient` and use its methods to upload files.

```typescript
import { Component, inject } from '@angular/core';
import { UploadClient, UploadService, FileInfo, UploadEventType, UploadEvent } from '@upupa/upload';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar'; // Example progress bar

@Component({
  selector: 'app-file-uploader',
  
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <input type="file" (change)="onFileSelected($event)" multiple>
    <div *ngFor="let progress of uploadProgress">
      <p>{{ progress.fileName }}: {{ progress.percentage }}%</p>
      <mat-progress-bar mode="determinate" [value]="progress.percentage"></mat-progress-bar>
    </div>
    <div *ngIf="uploadedFiles.length > 0">
      <h4>Uploaded:</h4>
      <ul>
        <li *ngFor="let file of uploadedFiles">{{ file.path }} ({{ file.size | fileSize }})</li>
      </ul>
    </div>
  `
})
export class FileUploaderComponent {
  private uploadClient = inject(UploadClient);
  private uploadService = inject(UploadService); // Inject core service for progress

  uploadProgress: { fileName: string, percentage: number }[] = [];
  uploadedFiles: FileInfo[] = [];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    this.uploadProgress = []; // Clear previous progress
    this.uploadedFiles = [];

    const files = Array.from(input.files);

    files.forEach(file => {
      const filePath = `/user-uploads/${Date.now()}_${file.name}`; // Example path structure
      const currentUpload = { fileName: file.name, percentage: 0 };
      this.uploadProgress.push(currentUpload);

      // Use UploadService to get progress
      this.uploadService.upload(this.uploadClient.baseUrl + filePath, file, file.name).subscribe({
        next: (event: UploadEvent) => {
          if (event.type === UploadEventType.UploadProgress) {
            currentUpload.percentage = event.percentage;
          } else if (event.type === UploadEventType.Response) {
            console.log('Upload successful:', event.body);
            this.uploadedFiles.push(event.body as FileInfo); // Assuming response is FileInfo
             // Remove from progress list on completion
             this.uploadProgress = this.uploadProgress.filter(p => p.fileName !== file.name);
          }
        },
        error: (err) => {
          console.error('Upload failed for:', file.name, err);
           // Remove from progress list on error
           this.uploadProgress = this.uploadProgress.filter(p => p.fileName !== file.name);
           // Handle error UI
        }
      });

      // Or use UploadClient for simpler async upload without progress:
      // this.uploadClient.uploadAsync(filePath, file, file.name)
      //   .then(fileInfo => {
      //     console.log('Upload successful (async):', fileInfo);
      //     this.uploadedFiles.push(fileInfo as FileInfo);
      //   })
      //   .catch(err => {
      //     console.error('Upload failed for:', file.name, err);
      //   });
    });
  }
}
```

### Using `FileSizePipe`

```html
<span>Size: {{ file.size | fileSize }}</span>
<!-- Example Output: Size: 1.23 MB -->
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
