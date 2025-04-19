# @ss/storage Module

This library provides file storage capabilities for NestJS applications, including handling uploads, downloads, deletions, and basic image manipulation.

## Overview

`@ss/storage` offers services and controllers to manage file persistence. It handles streaming uploads, saves files to the local filesystem (relative to the application's runtime directory), stores metadata in MongoDB, and provides API endpoints for interaction. It also includes specific handling for image files.

## Features

-   **File Uploads**: Handles streaming file uploads via `POST` and `PUT` requests to `/storage/**`.
    -   Saves incoming streams temporarily.
    -   Moves files to a final destination path derived from the request URL.
    -   Supports Base64 encoded file uploads.
-   **Metadata Storage**: Saves file metadata (original name, path, size, mimetype, custom meta, user, etc.) to a MongoDB collection (`storage`) using `@ss/data`.
-   **File Downloads**: Provides `GET /storage/**` endpoint to download stored files.
-   **File Deletion**: Handles `DELETE /storage/**` requests, removing the database record and moving the physical file to a trash directory (`_trashed`).
-   **Image Handling**: Includes `ImageService` and `ImageController` for image-specific operations (details require inspection, likely resizing/formatting for downloads).
-   **Authorization**: Integrates with `@ss/rules` (`AuthorizeService`) to protect storage endpoints.
-   **Dynamic Configuration**: Uses a dynamic module (`StorageModule`) configured via `StorageModule.register()`.

## Key Components

-   `StorageModule`: The main dynamic, global NestJS module.
    -   `StorageModule.register(options?)`: Static method for configuration (DB name, schema, prefix).
-   `StorageService`: Core service for saving metadata to DB and handling file deletion (moving to trash).
-   `StorageController`: Handles HTTP requests for upload (`POST`, `PUT`), download (`GET`), and delete (`DELETE`) operations.
    -   Orchestrates temporary saving, moving files to final location, and interacting with `StorageService` and `AuthorizeService`.
-   `ImageService`: Service for image-specific processing.
-   `ImageController`: Controller for image-specific API endpoints.
-   `FileSchema`: Default Mongoose schema for the `storage` collection.
-   `saveStreamToTmp`: Utility function to save an upload stream to a temporary OS directory.
-   `makeDir`, `mv`, `isFile`, `isDir`: Filesystem utility functions (Note: rely on `__dirname` and potentially non-portable `mv` command).

## Dependencies

-   `@nestjs/common`
-   `@ss/data`
-   `@ss/rules` (for authorization)
-   `@ss/common` (provides decorators like `@EndPoint`, `@MessageStream`, `logger`)
-   `@nestjs/mongoose`
-   `@noah-ark/common` (provides `PostedFile`, `File` types)
-   `mongoose`
-   `express` (types for `Request`, `Response`)

## Configuration

Configuration is done via `StorageModule.register(options)`:

```typescript
import { Module } from '@nestjs/common';
import { StorageModule } from '@ss/storage';
import { DataModule } from '@ss/data';
import { RulesModule } from '@ss/rules';
import { CommonModule } from '@ss/common';
import FileSchema from '@ss/storage/dist/schema'; // Adjust path if necessary

@Module({
  imports: [
    CommonModule.register(),
    DataModule.register({ /* ... dbOptions ... */ }),
    RulesModule.register({ /* ... rulesOptions ... */ }),
    StorageModule.register({
      dbName: 'DB_DEFAULT', // Database for storing file metadata
      storageSchema: FileSchema, // Mongoose schema for the 'storage' collection
      prefix: 'fs_' // Optional prefix for the storage collection
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

-   `options`: Specifies the database connection name (`dbName`), the schema (`storageSchema`), and an optional collection `prefix`.
-   **Important File Path Limitation**: The actual file storage location (both final destination and the `_trashed` directory) is relative to the application's runtime directory (`__dirname`). This path is determined by the API endpoint used during upload (e.g., uploading to `/storage/user/avatars` saves files under `__dirname/storage/user/avatars/`). There is currently no configuration option to set a different base storage directory, which might limit deployment flexibility.

## Usage

**1. Uploading Files:**
   -   Send a `POST` or `PUT` request with multipart/form-data to `/storage/{destination_path}`.
   -   The `{destination_path}` part of the URL determines the directory where the file will be saved (relative to `__dirname`).
   -   The service generates a unique ID (usually a MongoDB ObjectId) for the file, which becomes the filename base.
   -   Example: `POST /storage/user/avatars` with a file named `my_pic.jpg` might save the file as `storage/user/avatars/{objectId}.jpg` relative to `__dirname` and create a corresponding record in the `storage` collection.

**2. Downloading Files:**
   -   Send a `GET` request to `/storage/{path_to_file}`.
   -   Example: `GET /storage/user/avatars/{objectId}.jpg`.
   -   The controller retrieves the metadata from the database, finds the file on the filesystem, and streams it back with the original filename.

**3. Deleting Files:**
   -   Send a `DELETE` request to `/storage/{path_to_file}`.
   -   Example: `DELETE /storage/user/avatars/{objectId}.jpg`.
   -   The controller deletes the database record and moves the file to a `_trashed` directory.

**Example Client Request (Upload):**

```bash
curl -X POST \
  -F "file=@/path/to/your/image.png" \
  http://your-app.com/api/storage/uploads/images
# File might be saved to {app_root}/storage/uploads/images/{objectId}.png
```

**Example Client Request (Download):**

```bash
curl -o downloaded_image.png http://your-app.com/api/storage/uploads/images/{objectId}.png
```

**(Note: The actual base path `/api` depends on global prefixes set in the NestJS application.)**
