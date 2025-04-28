# @upupa/membership

Provides pre-built Angular components and routing for common user authentication and management flows.

This library simplifies the implementation of login, signup, password reset, account verification, and user management UIs by providing ready-to-use components that integrate with `@upupa/auth`, `@upupa/dynamic-form`, and `@upupa/cp`.

## Features

*   **Authentication Flow Components:**
    *   `LoginComponent`: Handles user login via email/password and configured Identity Providers (IDPs).
    *   `SignupComponent`: Handles user registration.
    *   `ForgotPasswordComponent`: Initiates the password reset flow.
    *   `ResetPasswordComponent`: Allows users to set a new password using a reset token.
    *   `VerifyComponent`: Handles account verification (e.g., email or phone).
*   **User Management UI (Admin):**
    *   `UsersListComponent`: Displays a list of users (likely using `@upupa/table`).
    *   `UserFormComponent`: A form for creating/editing user details.
    *   `RolesListComponent`: Component for managing user roles.
    *   Admin password reset functionalities.
*   **IDP Button Support:** Automatically displays buttons for configured external Identity Providers (Google, etc.) on the login/signup pages.
*   **Routing Module:** `MembershipRoutingModule` provides predefined routes (e.g., `/login`, `/signup`, `/forgot-password`) for the authentication components.
*   **Built on Upupa Libraries:** Leverages `@upupa/auth` for logic, `@upupa/dynamic-form` for forms, `@upupa/cp` and `@upupa/table` for management UI, and likely `@upupa/common`.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@upupa/auth` installed and configured.
*   `@upupa/dynamic-form` installed and configured.
*   `@upupa/cp`, `@upupa/table`, `@upupa/dialog`, `@upupa/authz` (likely needed for management features).
*   `@upupa/common`.
*   Angular Material (`@angular/material`, `@angular/cdk`) installed and configured.

**Steps:**

1.  Install the library and ensure all prerequisite `@upupa/*` and Angular Material libraries are installed:

    ```bash
    # Install this library
    npm install @upupa/membership
    # Ensure all prerequisites are installed (see list above)
    npm install @upupa/auth @upupa/dynamic-form @upupa/common @upupa/cp @upupa/table @upupa/dialog @upupa/authz @angular/material @angular/cdk

    # or using yarn
    yarn add @upupa/membership
    yarn add @upupa/auth @upupa/dynamic-form @upupa/common @upupa/cp @upupa/table @upupa/dialog @upupa/authz @angular/material @angular/cdk
    ```

2.  **Import Routing Module:** Import and include `MembershipRoutingModule` in your application's routing configuration.

    ```typescript
    // Example app.routes.ts
    import { Routes } from '@angular/router';
    import { MembershipRoutingModule } from '@upupa/membership';
    import { importProvidersFrom } from '@angular/core';

    export const appRoutes: Routes = [
      // Your other routes...
      {
        path: '', // Or another base path like '/account'
        loadChildren: () => import('@upupa/membership').then(m => m.MembershipRoutingModule)
        // Alternatively, spread the routes if using standalone routing setup:
        // ...MembershipRoutingModule.routes
      },
      // Example of integrating management UI within CP layout
      {
        path: 'cp',
        loadComponent: () => import('@upupa/cp').then(m => m.CpLayoutComponent),
        children: [
            // ... other cp routes
            {
                path: 'users-management', // Example path
                loadChildren: () => import('@upupa/membership').then(m => m.UsersManagementRoutingModule) // Assuming a separate module for management routes exists
            }
        ]
      }
    ];
    ```
    *(Note: Check the library's exported routing modules for the exact structure and names, e.g., `MembershipRoutingModule`, `UsersManagementRoutingModule`)*

3.  **Configure `@upupa/auth`:** Ensure `@upupa/auth` is configured correctly with necessary providers (e.g., `withEmailAndPassword`, `withGoogle`) as the membership components rely on it.

## Usage

Once installed and routed, navigate to the predefined paths (e.g., `/login`, `/signup`, `/forgot-password`) to use the components. The components will interact with the configured `AuthService` from `@upupa/auth`.

*   **Login:** `/login`
*   **Signup:** `/signup`
*   **Forgot Password:** `/forgot-password`
*   **Reset Password:** `/reset-password/:token` (The path might vary)
*   **Verify Account:** `/verify/:token` (The path might vary)
*   **User Management:** (Integrate routes, e.g., `/cp/users-management/users`, `/cp/users-management/roles`)

The appearance and specific form fields used by components like Login and Signup might be customizable via inputs or DI tokens (check component definitions or `default-values.ts`).

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
