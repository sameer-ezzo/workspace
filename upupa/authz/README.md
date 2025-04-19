# @upupa/authz

An Angular library for handling authorization based on rules and user principles, integrating with `@upupa/auth`.

## Features

*   **Rule-Based Authorization:** Define and manage authorization rules (likely fetched from a backend).
*   **Authorization Service:** Provides an `AuthorizationService` to programmatically check permissions for users (`Principle`) based on a resource `path` and an `action`.
*   **Declarative Directives:** Use `*authz` or `[authAction]` directives to easily show/hide or enable/disable UI elements based on user permissions.
*   **Permission Selectors:** Can evaluate and return data selectors (e.g., query filters) based on granted permissions.
*   **Integration with `@upupa/auth`:** Uses the current user (`Principle`) obtained from `@upupa/auth`'s `AuthService`.
*   **Powered by `@noah-ark`:** Leverages `@noah-ark/common` and `@noah-ark/expression-engine` for core rule evaluation.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@upupa/auth` installed and configured (provides user `Principle`).
*   `@angular/common/http` for fetching rules.
*   `@noah-ark/common` and `@noah-ark/expression-engine` (ensure these are installed, possibly as peer dependencies or globally).

**Steps:**

1.  Install the library:

    ```bash
    npm install @upupa/authz @upupa/auth @noah-ark/common @noah-ark/expression-engine
    # or
    yarn add @upupa/authz @upupa/auth @noah-ark/common @noah-ark/expression-engine
    ```
    *(Note: Verify if `@noah-ark` packages are explicitly needed or provided transitively)*

2.  **Provide Configuration:** Define the base URL for fetching permissions rules using the `PERMISSIONS_BASE_URL` token in your application providers.

    ```typescript
    // Example in app.config.ts (standalone)
    import { ApplicationConfig } from '@angular/core';
    import { provideHttpClient } from '@angular/common/http';
    import { PERMISSIONS_BASE_URL } from '@upupa/authz';
    // ... other imports

    export const appConfig: ApplicationConfig = {
      providers: [
        provideHttpClient(),
        // ... other providers (including auth)
        {
          provide: PERMISSIONS_BASE_URL,
          useValue: '/api/permissions' // Your backend endpoint for authz rules
        }
      ],
    };
    ```

3.  **Import the Module/Directive:** Import `AuthzModule` or the standalone `AuthorizeActionDirective` / `AuthzDirective` where needed.

    ```typescript
    // Example in a standalone component:
    import { AuthzDirective } from '@upupa/authz';

    @Component({
      // ...
      standalone: true,
      imports: [ AuthzDirective, /* ... other imports */ ],
      // ...
    })
    export class MyFeatureComponent { }
    ```

## Quick Start

### Using the `*authz` Directive

The `*authz` directive conditionally renders an element based on permissions. It takes a string combining the action and path (`action:path`) or just the path (`path`).

```html
<!-- Requires 'edit' permission on '/documents/123' -->
<button *authz="'edit:/documents/123'">Edit Document</button>

<!-- Requires default permission (e.g., 'view' or 'read') on '/reports/financial' -->
<div *authz="'/reports/financial'">
  <!-- Report Content -->
</div>

<!-- Can pass a specific user principle if needed (defaults to current user) -->
<button *authz="'delete:/users/456'; user: specificUser">Delete User (Admin View)</button>
```

### Using the `[authAction]` Directive

Similar to `*authz`, but uses separate inputs for `path` and `action`. It typically disables or hides the element if access is denied, rather than removing it from the DOM.

```html
<!-- Button will be disabled if user lacks 'create' permission on '/projects' -->
<button [authAction]
        path="/projects"
        action="create"
        (click)="createProject()">
  Create New Project
</button>

<!-- Hide the input if user lacks 'update' permission -->
<input type="text" [authAction]
     path="/settings/profile"
     action="update"
     [hideDenied]="true"
     placeholder="Change username">

<!-- Use a specific user -->
<button [authAction]
        path="/admin/logs"
        action="clear"
        [user]="currentUser">
    Clear Logs
</button>
```

### Using `AuthorizationService` Programmatically

Inject `AuthorizationService` to perform checks in your component logic.

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { AuthorizationService } from '@upupa/authz';
import { AuthService, Principle } from '@upupa/auth';
import { AuthorizeResult } from '@noah-ark/common';

@Component({ /* ... */ })
export class DocumentViewerComponent implements OnInit {
  readonly authzService = inject(AuthorizationService);
  readonly authService = inject(AuthService);

  canEdit = false;
  documentId = '123'; // Example document ID
  currentUser: Principle | null = null;

  async ngOnInit(): Promise<void> {
    this.currentUser = this.authService.user; // Get current user
    if (this.currentUser) {
      const result: AuthorizeResult = await this.authzService.authorize(
        `/documents/${this.documentId}`,
        'edit',
        this.currentUser
      );
      this.canEdit = result.access === 'grant';
    }
  }
}
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).