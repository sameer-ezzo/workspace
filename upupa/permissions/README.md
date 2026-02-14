# @upupa/permissions

An Angular library providing UI components and services for managing authorization rules and permissions, designed to work with `@upupa/authz`.

This library offers a user interface for administrators to define resource paths, rules, actions, and grant permissions to different roles or users.

## Features

*   **Rule Management UI:** Components to visualize, create, and edit the authorization rule hierarchy.
    *   `PermissionsPageComponent`: The main container component.
    *   `PermissionsSideBarComponent`: Displays the rule tree/hierarchy.
    *   `RuleFormComponent`: A form for defining rule properties (path, fallback, conditions, etc.).
*   **Permission Assignment UI:**
    *   `RulePermissionsTableComponent`: Displays and allows editing of specific permissions (grant/deny access for roles/users to actions on a path).
*   **Backend Interaction (`PermissionsService`):**
    *   Fetches the current rule tree (via `@upupa/authz`).
    *   Fetches available roles and user-specific permissions.
    *   Provides methods to save/update/delete rules and permissions via API calls.
*   **Routing:** Includes `PermissionsRoutingModule` for easy integration into an admin/CP section.
*   **Built on Upupa Libraries:** Leverages `@upupa/authz` (for rule evaluation/fetching), `@upupa/data` (for fetching roles/users), `@upupa/cp` and `@upupa/table` (for UI structure and tables), `@upupa/dynamic-form` (for rule forms), and `@upupa/common`.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@upupa/authz` installed and configured (including `PERMISSIONS_BASE_URL`).
*   `@upupa/auth` installed and configured.
*   `@upupa/data` installed.
*   `@upupa/cp`, `@upupa/table`, `@upupa/dynamic-form`, `@upupa/dialog`, `@upupa/mat-btn` (likely needed for UI components).
*   `@upupa/common`.
*   Angular Material (`@angular/material`, `@angular/cdk`) installed and configured.

**Steps:**

1.  Install the library and ensure all prerequisite `@upupa/*` and Angular Material libraries are installed:

    ```bash
    # Install this library
    npm install @upupa/permissions
    # Ensure all prerequisites are installed (see list above)
    npm install @upupa/authz @upupa/auth @upupa/data @upupa/cp @upupa/table @upupa/dynamic-form @upupa/dialog @upupa/mat-btn @upupa/common @angular/material @angular/cdk @noah-ark/common @noah-ark/expression-engine

    # or using yarn
    yarn add @upupa/permissions
    yarn add @upupa/authz @upupa/auth @upupa/data @upupa/cp @upupa/table @upupa/dynamic-form @upupa/dialog @upupa/mat-btn @upupa/common @angular/material @angular/cdk @noah-ark/common @noah-ark/expression-engine
    ```

2.  **Import Routing Module:** Integrate the `PermissionsRoutingModule` into your application's routing, typically within an admin or control panel section.

    ```typescript
    // Example app.routes.ts (within a CP layout)
    import { Routes } from '@angular/router';
    import { AuthGuard } from '@upupa/auth';
    import { CpLayoutComponent } from '@upupa/cp';
    // Assuming AuthzGuard checks for admin role or specific permission
    // import { AuthzGuard } from './guards/authz.guard';

    export const appRoutes: Routes = [
      // ... other routes
      {
        path: 'cp',
        component: CpLayoutComponent,
        canActivate: [AuthGuard],
        children: [
          // ... other cp routes
          {
            path: 'permissions', // Your chosen path for permissions management
            loadChildren: () => import('@upupa/permissions').then(m => m.PermissionsRoutingModule),
            // canActivate: [AuthzGuard] // Protect this section
          }
        ]
      }
    ];
    ```

3.  **Ensure Backend API:** Make sure you have a backend API implementation corresponding to the endpoints expected by `PermissionsService` (e.g., fetching/saving rules, permissions, roles), configured via the `PERMISSIONS_BASE_URL` token provided to `@upupa/authz`.

## Usage

Once installed and routed, navigate to the configured path (e.g., `/cp/permissions`). The `PermissionsPageComponent` will load, providing the UI to:

*   View the hierarchy of resource paths/rules in the sidebar.
*   Select a path/rule to view and edit its details (using `RuleFormComponent`).
*   Manage the specific permissions granted to roles/users for the selected path/rule (using `RulePermissionsTableComponent`).

The components interact with `PermissionsService` and `AuthorizationService` to load and save data.

### Error Handling Convention

Permission-management UI should parse API errors using `parseApiError` from `@upupa/common` and display `parsed.code` first:

```typescript
import { parseApiError } from '@upupa/common';


## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
