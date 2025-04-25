# @upupa/auth

An Angular library for handling user authentication, including token management, route protection, and support for multiple identity providers.

## Features

*   **Authentication Service:** Central `AuthService` to manage user state (login, logout, user info).
*   **Token Management:** Handles JWT access and refresh tokens, including automatic refresh.
*   **HTTP Interceptor:** Automatically attaches auth tokens to outgoing `HttpClient` requests.
*   **Route Guards:** Protect routes based on authentication status (`AuthGuard`) and verification status (`VerifyForceGuard`).
*   **Identity Providers (IDPs):** Supports various authentication methods (e.g., Email/Password, Google Sign-In - likely others configurable).
*   **User Management:** Provides methods for signup, password reset, email/phone verification.
*   **Role/Claim Checks:** Helper methods (`hasRole`, `hasClaim`) on `AuthService` for authorization checks.
*   **Impersonation:** Allows administrators to temporarily log in as other users.
*   **Configuration:** Flexible configuration via providers for base URL, password policies, and IDPs.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@angular/common/http` for interceptor functionality.
*   Dependencies for specific IDPs (e.g., `google-auth-library` for Google Sign-In).
*   `platform` and `@types/platform` (check `package.json` for versions).

**Steps:**

1.  Install the library and its peer dependencies:

    ```bash
    npm install @upupa/auth platform @types/platform google-auth-library
    # or
    yarn add @upupa/auth platform @types/platform google-auth-library
    ```
    *(Adjust IDP dependencies based on your needs)*

2.  **Configure the library:** Use `provideAuth` in your application's providers (e.g., `app.config.ts`) to set up the base options and enable specific IDPs.

    ```typescript
    // Example in app.config.ts (standalone)
    import { ApplicationConfig } from '@angular/core';
    import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
    import { provideAuth, AuthOptions, withEmailAndPassword, withGoogle } from '@upupa/auth';

    const authOptions: AuthOptions = {
      base_url: '/api/auth', // Your authentication backend endpoint
      password_policy: {
        minLength: 8,
        requireDigit: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSpecialChars: false
      },
      // Add other global options if needed
    };

    export const appConfig: ApplicationConfig = {
      providers: [
        provideHttpClient(withInterceptorsFromDi()), // Ensure HttpClient and interceptors are provided
        provideAuth(authOptions, // Base options
          withEmailAndPassword({ /* Email/Password specific config */ }),
          withGoogle({ clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' /* Google specific config */ })
          // Add other providers like withFacebook(), etc.
        ),
        // ... other providers
      ],
    };
    ```

## Quick Start

### Checking Authentication State

Inject `AuthService` and subscribe to `user$` observable or use the `userSignal`.

```typescript
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService, Principle } from '@upupa/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-status',
  standalone: true,
  template: `
    <div *ngIf="currentUser; else loggedOut">
      Welcome, {{ currentUser.name }}!
      <button (click)="logout()">Logout</button>
    </div>
    <ng-template #loggedOut>Please log in.</ng-template>
  `
})
export class UserStatusComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  currentUser: Principle | null = null;
  private userSubscription: Subscription;

  // Or use the signal directly in the template:
  // currentUserSignal = this.authService.userSignal;

  ngOnInit(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  logout(): void {
    this.authService.signout();
    // Optionally navigate to login page
  }
}
```

### Logging In (Email/Password Example)

```typescript
import { Component, inject } from '@angular/core';
import { AuthService, Credentials } from '@upupa/auth';
import { Router } from '@angular/router';

@Component({ /* ... */ })
export class LoginComponent {
  readonly authService = inject(AuthService);
  readonly router = inject(Router);
  errorMessage = '';

  async login(credentials: Credentials) {
    this.errorMessage = '';
    try {
      const user = await this.authService.signin(credentials);
      if (user) {
        this.router.navigate(['/dashboard']); // Navigate on success
      }
    } catch (error) {
      this.errorMessage = 'Login failed. Please check your credentials.';
      console.error('Login error:', error);
    }
  }
}
```

### Protecting Routes

Use `AuthGuard` in your route definitions.

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from '@upupa/auth';
import { DashboardComponent } from './dashboard/dashboard.component';

export const appRoutes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard] // Protect this route
  },
  // ... other routes
];
```

## More Examples

### Role-Based Access Control

Check roles within a component or use a custom guard.

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '@upupa/auth';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  template: `<div *ngIf="isAdmin">Admin Controls Here...</div>`
})
export class AdminPanelComponent {
  readonly authService = inject(AuthService);
  isAdmin = false;

  constructor() {
    // Check upon initialization or subscribe to user$ for dynamic changes
    this.isAdmin = this.authService.hasRole('admin');
  }
}
```

### Handling Verification (`VerifyForceGuard`)

Apply the guard to routes that require a verified account.

```typescript
import { Routes } from '@angular/router';
import { AuthGuard, VerifyForceGuard } from '@upupa/auth';
import { SensitiveDataComponent } from './sensitive-data/sensitive-data.component';

export const appRoutes: Routes = [
  {
    path: 'sensitive',
    component: SensitiveDataComponent,
    canActivate: [AuthGuard, VerifyForceGuard] // Must be logged in AND verified
  },
  // ... other routes
];
```
*(Note: This assumes `VerifyForceGuard` redirects unverified users to a specific verification page, which needs to be configured/handled)*

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).