# @ss/users Module

This library provides the primary API endpoints for user management and authentication-related actions within the application.

## Overview

`@ss/users` centralizes user-facing operations like sign-up, sign-in (password, refresh token, social logins), password management, account verification, profile updates (via `@ss/api`), and administrative user actions. It acts as a high-level interface, orchestrating calls to core services provided by `@ss/auth`, `@ss/data`, and `@ss/rules`.

## Features

-   **Authentication Endpoints**: Provides RESTful endpoints for:
    -   Sign Up (`POST /auth/signup`)
    -   Sign In (`POST /auth/signin` - password & refresh grant types)
    -   Social Logins (Google, Facebook - `/auth/google`, `/auth/facebook`, callbacks, client token verification)
    -   Get Current User (`GET /auth/whoami`)
-   **Password Management**:
    -   Forgot Password (`POST /auth/forgot-password`)
    -   Reset Password (`POST /auth/resetpassword`)
    -   Change Password (User) (`POST /auth/changepassword/:id`)
    -   Admin Password Reset (`POST /auth/adminreset`)
-   **Account Verification**:
    -   Send Verification Token (`POST /auth/send-verification`)
    -   Verify Token (`POST /auth/verify`)
-   **User Administration (requires super-admin role)**:
    -   Create User (`POST /auth/admincreateuser`)
    -   Add Roles to User (`POST /auth/addusertoroles`)
    -   Change User Roles (`POST /auth/changeuserroles`)
    -   Lock/Unlock User Account (`POST /auth/lock`)
    -   Impersonate User (`POST /auth/impersonate`)
-   **Account Management**:
    -   Check User Existence (`POST /auth/check-user`)
    -   Manage User Devices (`POST /auth/update-device`, `POST /auth/remove-device`)
-   **Event Emission**: Emits events for key actions (e.g., `UserSignedUpEvent`, `UserForgotPasswordEvent`, `UserSendVerificationEvent`, `UserCreatedEvent`) using `@nestjs/event-emitter`.
-   **Authorization**: Endpoints are protected using `@ss/rules` (`AuthorizeService` and `@Authorize` decorator).
-   **Super Admin Setup**: Automatically creates/configures a super admin user on startup based on configuration.

## Key Components

-   `UsersModule`: The main dynamic, global NestJS module.
    -   `UsersModule.register(userOptions?)`: Static method for configuration (primarily super admin details).
-   `UsersController`: The main controller handling all `/auth/**` endpoints.
    -   Injects and utilizes `AuthService`, `DataService`, `AuthorizeService`, `EventEmitter2`.
-   `events.ts`: Defines user-related event classes (e.g., `UserSignedUpEvent`).
-   `UsersOptions`: Interface for module configuration.

## Dependencies

-   `@nestjs/common`, `@nestjs/core`, `@nestjs/passport`, `@nestjs/event-emitter`
-   `@ss/auth` (provides `AuthService`)
-   `@ss/data` (provides `DataService`)
-   `@ss/rules` (provides `AuthorizeService`, `@Authorize`)
-   `@ss/common` (provides `@EndPoint`, `@Message`, `logger`)
-   `@noah-ark/common` (provides `User`, `Principle` types)
-   `google-auth-library`, `axios` (for external auth verification)

## Configuration

Configuration is done via `UsersModule.register(userOptions)`:

```typescript
import { Module } from '@nestjs/common';
import { UsersModule } from '@ss/users';
import { AuthModule } from '@ss/auth';
import { DataModule } from '@ss/data';
import { RulesModule } from '@ss/rules';
import { CommonModule } from '@ss/common';

@Module({
  imports: [
    CommonModule.register(),
    DataModule.register({ /* ... dbOptions ... */ }),
    AuthModule.register({ /* ... authOptions ... */ }),
    RulesModule.register({ /* ... rulesOptions ... */ }),
    UsersModule.register({
      superAdmin: {
        email: process.env.SUPER_ADMIN_EMAIL, // Required
        password: process.env.SUPER_ADMIN_PASSWORD, // Required
        username: process.env.SUPER_ADMIN_USERNAME, // Optional, defaults to email
        name: process.env.SUPER_ADMIN_NAME // Optional
      }
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

-   `userOptions.superAdmin`: If provided with a valid `email` and `password`, the module will ensure this user exists and has the `super-admin` role upon application startup. **Warning:** Avoid hardcoding credentials directly in the registration as shown in the example. Use environment variables (`process.env`) for security.

## Usage

This module primarily exposes API endpoints under the `/auth` path (or whatever global prefix is configured). Clients interact with these endpoints for registration, login, password management, etc.

**Example API Calls:**

-   **Sign Up:** `POST /auth/signup` with user data (username/email/phone, password) in the body.
-   **Sign In:** `POST /auth/signin` with `{ grant_type: 'password', username: '...', password: '...' }` or `{ grant_type: 'refresh', refresh_token: '...' }`.
-   **Forgot Password:** `POST /auth/forgot-password` with `{ email: '...' }`.
-   **Who Am I:** `GET /auth/whoami` (requires Authorization header with Bearer token).

See the `UsersController` source code (`users.controller.ts`) for details on all available endpoints, required payloads, and authorization requirements.
