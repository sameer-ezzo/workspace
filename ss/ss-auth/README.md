# @ss/auth Module

This module provides authentication and authorization functionalities for the application backend, built using NestJS.

## Overview

The `@ss/auth` module handles user registration, login (including social logins), session management via JWT, password management, role-based access control (RBAC), and security features like login attempt throttling. It's designed as a dynamic module, allowing flexible configuration for different database connections, user schemas, and authentication behaviors.

## Features

-   **Dynamic Configuration**: Easily configure database connection, user schema, JWT settings, and other options via the `register` method and environment variables.
-   **JWT Authentication**: Implements JWT-based authentication for stateless session management.
-   **Social Logins**: Supports Google and Facebook authentication out-of-the-box (configurable via environment variables).
-   **Role-Based Access Control (RBAC)**: Integrates with user roles for authorization checks (likely via guards/decorators).
-   **Password Management**: Includes features for password reset and potentially hashing/verification.
-   **Security**: Implements features like login attempt limits and email/phone verification requirements.
-   **Global Interceptor**: Provides an `AuthenticationInterceptor` to automatically process authentication tokens on incoming requests.
-   **Mongoose Integration**: Uses Mongoose for database interactions with User and Role schemas.

## Key Components

-   `AuthModule`: The main dynamic module. Configured using `AuthModule.register(modelOptions, authOptions)`.
-   `AuthService`: Contains the core business logic for authentication (login, signup, token generation, etc.).
-   `AuthenticationInterceptor`: A global interceptor that likely validates JWT tokens and attaches user information to the request context.
-   `AuthGuard`: A NestJS guard (likely used with decorators) to protect routes based on authentication status or roles.
-   `UserSchema`, `RoleSchema`: Mongoose schemas defining the structure of user and role data in the database.
-   `GoogleStrategy`, `FacebookStrategy`: Passport strategies for handling external OAuth providers.
-   `AuthOptions`: Interface defining the configuration options for the module.
-   Custom Decorators: Provides decorators (e.g., `@User()`, `@Roles()`) for easier access to user data and role checking in controllers/services.

## Dependencies

-   `@nestjs/common`, `@nestjs/core`, `@nestjs/passport`, `@nestjs/mongoose`
-   `@ss/common`
-   `@ss/data`
-   `passport`, `passport-jwt`, `passport-google-oauth20`, `passport-facebook` (likely)
-   `mongoose`

## Configuration

The module primarily reads configuration from environment variables. Key variables include:

-   `SECRET_KEY`: JWT secret.
-   `accessTokenExpiry`, `refreshTokenExpiry`: JWT token lifetimes.
-   `forceEmailVerification`, `forcePhoneVerification`: Booleans to enforce verification.
-   `issuer`: JWT issuer identifier.
-   `maximumAllowedLoginAttempts`, `maximumAllowedLoginAttemptsExpiry`: Login throttling settings.
-   `resetTokenExpiry`: Password reset token lifetime.
-   `sendWelcomeEmail`: Boolean to enable/disable welcome emails.
-   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth credentials.
-   `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`: Facebook OAuth credentials.
-   `CLIENT_URL`, `CALLBACK_BASE`: URLs used for OAuth callbacks.

Default values are provided in `auth-options.ts`.

## Usage

1.  **Import and Register**: Import `AuthModule` in your root application module (`app.module.ts`) and register it:

    ```typescript
    import { AuthModule } from '@ss/auth';
    import { userSchemaFactory } from '@ss/auth'; // Or your custom schema
    import { Module } from '@nestjs/common';
    import { DataModule } from '@ss/data'; // Assuming DataModule provides 'DB_DEFAULT'

    @Module({
      imports: [
        DataModule.register({ dbName: 'DB_DEFAULT', /* ... other options */ }), // Ensure DataService is available
        AuthModule.register(
          // If modelOptions are omitted, default user/role schemas from @ss/auth are used.
          { dbName: 'DB_DEFAULT', userSchema: userSchemaFactory('ObjectId') }, // Or your specific DB name and schema
          // AuthOptions like 'secret' can be overridden here.
          // WARNING: Avoid hardcoding secrets; use environment variables.
          { secret: process.env.JWT_SECRET /* Optional overrides for AuthOptions */ }
        ),
        // ... other modules
      ],
    })
    export class AppModule {}
    ```

2.  **Protect Routes**: Use `AuthGuard` and role decorators in your controllers:

    ```typescript
    import { Controller, Get, UseGuards } from '@nestjs/common';
    import { AuthGuard, Roles, User } from '@ss/auth'; // Assuming AuthGuard and decorators are exported

    @Controller('profile')
    @UseGuards(AuthGuard) // Require authentication
    export class ProfileController {
      @Get()
      getProfile(@User() user: any) { // Inject user object
        return user;
      }

      @Get('admin')
      @Roles('admin') // Require 'admin' role
      getAdminData() {
        return { message: 'Admin only content' };
      }
    }
    ```

*(Note: Specific implementation details like decorator names (`@User`, `@Roles`, `AuthGuard`) might need verification based on `decorators.ts`, `auth.guard.ts` and `index.ts` exports.)*
