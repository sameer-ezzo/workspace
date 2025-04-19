# @ss/rules Module

This library provides a comprehensive authorization and permission management system for NestJS applications, built upon the `@noah-ark/common` Rule engine and `@noah-ark/expression-engine`.

## Overview

`@ss/rules` enables fine-grained access control by defining rules based on resource paths and associating permissions with specific actions (e.g., read, write, delete). It integrates seamlessly with NestJS controllers using decorators and interceptors, allows managing permissions via an API, and supports persisting permissions in a database.

## Features

-   **Rule-Based Access Control**: Defines authorization rules using the `Rule` structure from `@noah-ark/common`, organized hierarchically based on resource paths.
-   **Dynamic Configuration**: Uses a dynamic module (`RulesModule`) configured via `RulesModule.register()`.
-   **Permission Management**:
    -   Manages rules and associated permissions (`Permission` objects) using `RulesService` and `RulesManager`.
    -   Supports defining rules in code (`appRules`).
    -   Automatically creates rules based on API endpoint paths (`@Controller` prefixes).
    -   Loads permissions from a database (MongoDB via Mongoose).
    -   Extracts permissions defined via the `@Authorize` decorator on controller methods.
    -   Provides `PermissionController` for managing permissions via REST API.
-   **Authorization Checks**:
    -   `AuthorizeService` performs authorization checks using the rule set and the `@noah-ark/expression-engine`.
    -   `AuthorizeInterceptor` automatically enforces authorization checks globally for incoming requests.
    -   `@Authorize` decorator likely used to specify required permissions or trigger checks on specific controller methods.
-   **Extensibility**: Supports custom authorization logic via templates (`AuthorizationTemplate` from `@noah-ark/expression-engine`).

## Key Components

-   `RulesModule`: The main dynamic, global NestJS module.
    -   `RulesModule.register(options?, rootRule?, appRules?, templates?)`: Static method for configuration.
-   `RulesService`: Manages the collection of rules (`RulesManager`) and permissions, handling loading from DB, code, and decorators.
-   `AuthorizeService`: Performs authorization checks by evaluating rules against incoming requests.
-   `AuthorizeInterceptor`: Global NestJS interceptor that likely invokes `AuthorizeService` for protected routes.
-   `@Authorize` (decorator): Custom decorator used on controller methods to specify permissions or trigger authorization.
-   `PermissionController`: Controller for managing permission records via API.
-   `RulesImporterService`: Service for importing rules (details require inspection).
-   `Rule`, `Permission`, `Principle`, `AuthorizeMessage`: Core interfaces/types from `@noah-ark/common`.
-   `authorize`: Core evaluation function from `@noah-ark/expression-engine`.
-   `SimplePermissionSchema`: Default Mongoose schema for storing permission records.

## Dependencies

-   `@nestjs/common`, `@nestjs/core`
-   `@ss/data` (for storing/retrieving permissions)
-   `@ss/common` (provides `EndpointsInfo`, `logger`)
-   `@nestjs/mongoose`
-   `@noah-ark/common`
-   `@noah-ark/expression-engine`
-   `@noah-ark/json-patch`

## Configuration

Configuration is done via `RulesModule.register(options?, rootRule?, appRules?, templates?)`:

```typescript
import { Module } from '@nestjs/common';
import { RulesModule, DenyRule, GrantRule } from '@ss/rules';
import { DataModule } from '@ss/data';
import { CommonModule } from '@ss/common';
import { SimplePermissionSchema } from '@ss/rules'; // Or your custom schema
import { Rule } from '@noah-ark/common';

// Example App-Specific Rules (optional)
const customAppRules: Rule[] = [
  { name: 'admin-section', path: '/admin', fallbackAuthorization: 'deny', ruleSource: 'code' },
  // ... other rules
];

@Module({
  imports: [
    CommonModule.register(),
    DataModule.register({ /* ... dbOptions ... */ }), // Ensure DataService is available
    RulesModule.register(
      {
        dbName: 'DB_DEFAULT', // DB for storing permissions
        permissionSchema: SimplePermissionSchema,
        prefix: 'auth_' // Optional prefix for permission collection
      },
      GrantRule,
      customAppRules, // Rules defined in code (imported from e.g., './app.rules')
      [] // Custom authorization templates (optional)
    ),
    // ... other modules
  ],
})
export class AppModule {}
```

-   `options`: Database configuration for the `permission` collection.
-   `rootRule`: The base rule (e.g., `DenyRule`, `GrantRule`) determining default access.
-   `appRules`: An array of `Rule` objects defined in code.
-   `templates`: Custom `AuthorizationTemplate` definitions.

## Usage

**1. Define Rules/Permissions:**
   -   **Via Code:** Provide `Rule` objects in the `appRules` array during registration (imported from a separate file).
   -   **Via Decorators:** Use the `@Authorize` decorator on controller methods. Permissions defined here are automatically discovered and associated with rules based on the controller/method path.
   -   **Via API:** Use the endpoints exposed by `PermissionController` (likely `/permission`) to create/update/delete `Permission` records in the database. These are loaded by `RulesService`.
   -   **Automatically:** Rules corresponding to controller paths (`/prefix`) are often created automatically.

**2. Protect Routes (using Decorator and Interceptor):**

The `AuthorizeInterceptor` is registered globally. Use the `@Authorize` decorator (assuming its existence and functionality) on controller methods that require specific permissions.

```typescript
import { Controller, Get, Post, Body, UseInterceptors } from '@nestjs/common';
import { Authorize } from '@ss/rules'; // Assuming the decorator exists

@Controller('products')
export class ProductsController {

  @Get()
  @Authorize({ action: 'read' }) // Requires 'read' permission on the 'products' rule
  findAll() {
    // ... implementation
  }

  @Post()
  @Authorize({ action: 'create', roles: ['admin', 'editor'] }) // Example: Requires 'create' permission AND admin/editor role
  create(@Body() createProductDto: any) {
    // ... implementation
  }

  @Get(':id')
  @Authorize({ action: 'read' }) // Requires 'read' permission on the 'products' rule
  findOne(id: string) {
      // Access granted by interceptor if authorized
      // ... implementation
  }
}
```

**3. Manual Authorization Check (in Services):**
Inject `AuthorizeService` to perform checks programmatically.

```typescript
import { Injectable } from '@nestjs/common';
import { AuthorizeService } from '@ss/rules';
import { IncomingMessage, Principle } from '@noah-ark/common';

@Injectable()
export class ProductUpdateService {
  constructor(private readonly authorizeService: AuthorizeService) {}

  async updateProduct(productId: string, updates: any, user: Principle) {

    // Construct a message mimicking an incoming request
    const message: IncomingMessage = {
      path: `/products/${productId}`,
      operation: 'update',
      principle: user,
      request: {}
    };

    const authResult = this.authorizeService.authorize(message, 'update', { newData: updates });

    if (authResult.access !== 'grant') {
      throw new Error(`Unauthorized to update product ${productId}`);
    }

    // ... proceed with update logic
  }
}
```
