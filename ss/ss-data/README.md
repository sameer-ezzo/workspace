# @ss/data Module

This library provides a robust data access layer for NestJS applications, primarily using Mongoose for MongoDB interactions. It facilitates multi-database connections, schema management, CRUD operations, querying, migrations, and data change tracking.

## Overview

`@ss/data` centralizes database interactions through a dynamic `DataModule` and a powerful `DataService`. It allows applications to configure connections to multiple MongoDB databases, define schemas and models, and perform various data operations through a consistent service interface. Key features include structured API query parsing, JSON Patch support for updates, and integration with a messaging system for data change events.

## Features

-   **Dynamic Module (`DataModule`)**: A global module configured via `DataModule.register()`.
    -   **Multi-Database Support**: Manages connections to multiple MongoDB databases defined in the configuration.
    -   **Schema/Model Management**: Dynamically registers Mongoose schemas and models based on configuration, including options for timestamps, strict mode, collection prefixes, and JSON exclusion.
    -   **Dedicated `DataService` per DB**: Provides a separate `DataService` instance for each configured database connection.
-   **`DataService`**: The core service for interacting with a specific database connection.
    -   **CRUD Operations**: Provides methods for `find`, `get`, `post` (create), `put` (replace), `patch` (update), and `delete`.
    -   **Advanced Querying**: Supports complex queries, sorting, pagination, projections, and aggregation pipelines (`agg`, `aggCount`).
    -   **API Query Parsing**: Integrates `QueryParser` (`api.query.ts`) to translate API-style query parameters into MongoDB operations.
    -   **JSON Patch Support**: Allows partial updates using JSON Patch (`patch` method), leveraging `jsonpatch-to-mongodb`.
    -   **Data Change Events**: Publishes `DataChangedEvent` via the `@ss/common` `Broker` on data modifications.
    -   **Model Handling**: Methods to get or add Mongoose models (`getModel`, `addModel`), optionally auto-creating models with dynamic schemas.
    -   **Migration Integration**: Works with `MigrationsService` to apply database migrations during initialization.
-   **Migrations**: Includes `MigrationsService` (`migrations.svr.ts`) and schema (`migration-schema.ts`) for managing database schema evolution.
-   **Data Change Tracking**: Infrastructure (`data.change.service.ts`, `change-schema.ts`) potentially for detailed change logging or event sourcing (details require further inspection).

## Key Components

-   `DataModule`: The main dynamic, global NestJS module.
    -   `DataModule.register(databasesCollections)`: Static method for configuration.
-   `DataService`: The primary service for database interaction per connection.
-   `QueryParser`: Translates API query strings into MongoDB queries/pipelines.
-   `MigrationsService`: Handles execution of database migrations.
-   `DatabasesOptions`, `DatabaseInfo`, `DbConnectionOptions`, `DbModelDefinitionInfo`: Interfaces/types for configuring database connections and models.
-   `DataChangedEvent`: Event payload published on data changes.
-   `getDataServiceToken(dbName)`: Function to get the injection token for a specific database's `DataService`.

## Dependencies

-   `@nestjs/common`, `@nestjs/mongoose`
-   `@ss/common` (requires `Broker` provider)
-   `mongoose`, `mongoose-unique-validator`
-   `@noah-ark/path-matcher`, `@noah-ark/json-patch`
-   `jsonpatch-to-mongodb`

## Configuration

Configuration is done via the `DataModule.register(databasesCollections)` method. The `databasesCollections` object (type `DatabasesOptions`) defines each database connection:

```typescript
// Example DatabasesOptions structure
const dbOptions: DatabasesOptions = {
  DB_DEFAULT: { // Logical name for the default database connection
    uri: process.env.DB_DEFAULT_URI, // MongoDB connection string
    dbConnectionOptions: { // Mongoose connection options
      retryAttempts: 3,
      prefix: 'app_' // Optional collection prefix
    },
    models: {
      user: { // Model name
        schema: UserSchema, // Your Mongoose schema instance or definition
        options: { timestamps: true },
        exclude: ['password'] // Fields to exclude from default toJSON
      },
      product: {
        schema: ProductSchema
      }
    },
    migrations: [
      // Migration implementation instances (IDbMigration)
      new UserMigrationV1(),
      new ProductMigrationV1()
    ]
  },
  DB_LOGS: { // Another logical database connection
    uri: process.env.DB_LOGS_URI,
    models: {
      auditLog: { schema: AuditLogSchema }
    }
  }
};

// In your app.module.ts imports:
DataModule.register(dbOptions)
```

-   Connection details (`uri`, `dbConnectionOptions`) are specified per database.
-   Models are defined with their schema, options, and optional JSON exclusions. You can also register schemas imported from other modules (like `userSchema` from `@ss/auth`) here if you prefer to centralize all model definitions for a connection.
-   Migrations are provided as an array of objects implementing `IDbMigration`.

## Usage

**1. Register DataModule (e.g., in `app.module.ts`)**

```typescript
import { Module } from '@nestjs/common';
import { DataModule } from '@ss/data';
import { CommonModule } from '@ss/common'; // Needed for Broker
import { dbOptions } from './db.config'; // Your DatabasesOptions configuration

@Module({
  imports: [
    CommonModule.register(), // Ensure Broker is available
    DataModule.register(dbOptions),
    // ... other modules
  ],
})
export class AppModule {}
```

**2. Inject DataService**

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { DataService, getDataServiceToken } from '@ss/data';
import { Patch } from '@ss/data'; // Import Patch type if needed

@Injectable()
export class UserService {
  constructor(
    // Inject the default DataService (linked to DB_DEFAULT)
    private readonly data: DataService,
    // Inject DataService for a specific connection
    @Inject(getDataServiceToken('DB_LOGS')) private readonly logData: DataService
  ) {}

  async findUserById(id: string) {
    // Use the default data service
    return this.data.find<User>('user', id);
  }

  async updateUserProfile(id: string, patches: Patch[]) {
    const result = await this.data.patch<User>(
        `user/${id}`,
        patches,
        /* user context (optional) */
    );
    if (result.errors) {
      // Handle errors
    }
    return result.document;
  }

  async logAction(logEntry: any) {
    // Use the specific logs data service
    await this.logData.post('auditLog', logEntry);
  }

  async findUsers(query: any, sort: any, page: number, limit: number) {
      // Example using find for multiple documents
      return this.data.find<User[]>('user', undefined, undefined, {}, query, sort, page, limit)
  }
}
```

**3. Using Path-Based Methods**

Many `DataService` methods use a path syntax (e.g., `collectionName/documentId/subPath`).

```typescript
// Get a specific user
const user = await dataService.get('user/someUserId');

// Get a specific field within a user document
const email = await dataService.get('user/someUserId/email');

// Delete a user
await dataService.delete('user/someUserId');

// Patch a user's address
const patch: Patch = { op: 'replace', path: '/address/city', value: 'New City' };
await dataService.patch('user/someUserId', [patch]);
```
