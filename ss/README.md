# @ss Backend Libraries

This directory contains a collection of NestJS libraries (`@ss/*`) designed to provide reusable backend services and modules for building applications within this workspace.

## Overview

The `@ss` libraries form the core backend infrastructure, offering features such as:

-   **Authentication & Authorization**: Comprehensive handling of user authentication (JWT, social logins), role-based access control (RBAC), and permission management (`@ss/auth`, `@ss/users`, `@ss/rules`).
-   **Data Persistence**: Robust data access layer using Mongoose, supporting multiple database connections, dynamic model registration, migrations, and advanced querying (`@ss/data`).
-   **Common Utilities**: Foundational services for application bootstrapping, clustering, messaging (Redis/in-memory), WebSocket handling, Redis client management, and logging (`@ss/common`).
-   **Generic API**: A standard RESTful API layer for CRUD operations and data export, integrating with the data and rules modules (`@ss/api`).
-   **File Storage**: Services and controllers for handling file uploads, downloads, and metadata storage (`@ss/storage`).
-   **Notifications**: A system for sending notifications across multiple channels (e.g., email, push) based on topics and user preferences (`@ss/notifications`).

## Key Libraries

-   `@ss/common`: Core utilities, bootstrapping, messaging, Redis, WebSockets. (See its README)
-   `@ss/data`: Multi-DB Mongoose data access, migrations, query parsing. (See its README)
-   `@ss/auth`: JWT/Social Auth, RBAC foundations, User/Role schemas. (See its README)
-   `@ss/users`: User management API endpoints (signup, signin, password mgmt, admin actions). (See its README)
-   `@ss/rules`: Path-based authorization rule engine, permission management, API/decorator integration. (See its README)
-   `@ss/api`: Generic CRUD and export REST API layer. (See its README)
-   `@ss/storage`: File upload/download handling and metadata storage. (See its README)
-   `@ss/notifications`: Multi-channel notification sending system. (See its README)

## Usage

The `@ss` libraries are designed as dynamic, global NestJS modules, typically registered in the root `AppModule` of backend applications (e.g., `crow-vista-api`, `verifysy-api`).

1.  **Identify Needs:** Determine which backend functionalities are required (e.g., database access, authentication, file storage).
2.  **Register Modules:** Import the corresponding `@ss` modules into your main application module (`AppModule`). Most `@ss` libraries use a static `.register()` method for configuration.
3.  **Configure:** Provide necessary configuration options to the `.register()` methods (e.g., database connection details for `@ss/data`, channel implementations for `@ss/notifications`, root authorization rule for `@ss/rules`). Configuration often relies on environment variables.
4.  **Inject Services:** Inject the services exported by the `@ss` modules (e.g., `DataService`, `AuthService`, `NotificationService`, `StorageService`, `AuthorizeService`) into your application's controllers and services where needed.

**Conceptual Example (`AppModule`):**

```typescript
import { Module } from '@nestjs/common';
import { CommonModule } from '@ss/common';
import { DataModule } from '@ss/data';
import { AuthModule, userSchemaFactory } from '@ss/auth';
import { RulesModule, DenyRule } from '@ss/rules';
import { ApiModule } from '@ss/api';
import { UsersModule } from '@ss/users';
import { StorageModule, FileSchema } from '@ss/storage';
import { NotificationsModule } from '@ss/notifications';
// Import app-specific schemas, rules, notification channels etc.
import { YourAppSchema } from './schemas/your-app.schema';
import { appRules } from './app.rules';
import { EmailChannel } from './channels/email.channel';

const dbOptions = {
    DB_DEFAULT: {
        uri: process.env.DB_DEFAULT_URI,
        models: {
            yourAppModel: { schema: YourAppSchema },
            // Optionally register auth/storage schemas here too
            user: { schema: userSchemaFactory('ObjectId') }
         }
    }
};

const notificationTopics = { /* ... your topics ... */ };

@Module({
  imports: [
    CommonModule.register(), // Use defaults or provide config
    DataModule.register(dbOptions),
    // Register AuthModule, providing DB connection info
    AuthModule.register({ dbName: 'DB_DEFAULT', userSchema: userSchemaFactory('ObjectId') }),
    // Register StorageModule, providing DB info
    StorageModule.register({ dbName: 'DB_DEFAULT', storageSchema: FileSchema }),
    // Register RulesModule with DB info, default rule, and app rules
    RulesModule.register({ dbName: 'DB_DEFAULT' }, DenyRule, appRules),
    ApiModule.register(), // Generic CRUD API
    // Register UsersModule, ensure SUPER_ADMIN env vars are set
    UsersModule.register({ superAdmin: { email: process.env.SUPER_ADMIN_EMAIL, password: process.env.SUPER_ADMIN_PASSWORD } }),
    // Register NotificationsModule with channels, topics, and DB config
    NotificationsModule.register([EmailChannel], notificationTopics, { dbName: 'DB_DEFAULT' }),
  ],
  controllers: [/* ... Your App Controllers ... */],
  providers: [/* ... Your App Services, EmailChannel ... */],
})
export class AppModule {}
```

**Important:** This example illustrates the general pattern. Ensure correct configuration options, environment variables, and dependencies (like providing `EmailChannel` if used) are set according to each library's specific requirements.

**Always refer to the specific `README.md` file within each `@ss/*` library's directory for detailed configuration options, API usage, and concrete examples.**