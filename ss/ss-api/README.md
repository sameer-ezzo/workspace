# `@ss/api` Module

This module provides the core RESTful API endpoints for the application.

## Overview

The `ss-api` module acts as a generic gateway for handling standard CRUD (Create, Read, Update, Patch, Delete) operations and data export functionalities. It leverages other shared modules for data access, authorization, and common utilities.

## Features

-   **Dynamic CRUD Endpoints**: Handles POST, GET, PUT, PATCH, and DELETE requests on `/api/**` paths. It dynamically routes these requests to the appropriate data service methods based on the URL path.
-   **Data Export**: Provides a `/api/export/**` endpoint (GET) to export data in CSV format.
-   **Authorization**: Integrates with the `@ss/rules` module to enforce authorization rules before performing write operations (Update, Patch, Delete).
-   **Error Handling**: Implements comprehensive error handling to map database-specific errors to standard HTTP status codes and user-friendly messages.

## Dependencies

-   `@nestjs/common`: Core NestJS framework functionalities.
-   `@ss/data`: Handles data persistence and retrieval logic.
-   `@ss/rules`: Provides authorization services.
-   `@ss/common`: Contains shared decorators (`@EndPoint`, `@Message`), logging utilities (`logger`), and potentially other common code.
-   `object-to-csv`: Used for converting data to CSV format during export.

## Key Components

-   `ApiModule`: The main NestJS module definition. It uses a static `register` method, making it a dynamic module that can be configured during application startup. It registers `ApiController`.
-   `ApiController`: The controller responsible for handling all incoming HTTP requests to the `/api` base path. It orchestrates calls to the data and authorization services.
-   `_query`: (Internal helper) Parses incoming request paths and query parameters.
-   `provideApiRulesFromPaths`: A function likely used during setup to automatically generate basic authorization rules based on defined API paths.

## Usage

This module is typically imported into the main application module (e.g., `AppModule`) using its static `register` method.

```typescript
// Example in AppModule
import { Module } from '@nestjs/common';
import { ApiModule } from '@ss/api';
import { DataModule } from '@ss/data'; // Assuming DataModule provides DataService
import { RulesModule } from '@ss/rules'; // Assuming RulesModule provides AuthorizeService
import { CommonModule } from '@ss/common';

@Module({
  imports: [
    CommonModule,
    DataModule,
    RulesModule,
    ApiModule.register({ /* options if any */ }),
    // ... other modules
  ],
})
export class AppModule {}
```
