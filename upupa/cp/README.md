# @upupa/cp

A library for building Control Panel (CP) or Admin Dashboard interfaces in Angular, providing layouts, common CP components, and helpers for forms and routing.

## Features

*   **CP Layouts:** Pre-built layout components (`CpLayoutComponent`, `CenterLayoutComponent`) with sidebar, toolbar, and content area, using Angular Material.
*   **Routing Helpers:** Utilities (`cp-layout-routes`) to easily integrate feature routes within the main CP layout.
*   **Common CP Components:** Includes components like `ToolbarUserMenuComponent`, `WizardLayoutComponent`, and various button helpers (`FormDialogBtnComponent`).
*   **Simplified Form Handling:**
    *   `@FormViewModel` decorator (likely wrapping `@upupa/dynamic-form`) for defining forms via ViewModels.
    *   Helper function (`openFormDialog`) to open forms based on ViewModels in dialogs.
    *   Helper function (`adapterSubmit`) for submitting form data (likely integrates with `@upupa/data` adapters).
    *   `DataFilterFormComponent` for creating filter forms.
*   **Authorization Integration:** Integrates with `@upupa/authz` to control UI element visibility based on permissions within layouts.
*   **Built on Angular Material:** Leverages and styles Angular Material components for a consistent look and feel.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   Angular Material (`@angular/material`, `@angular/cdk`) installed and configured.
*   `@upupa/common` (likely provides base utilities/types).
*   `@upupa/auth` (for user information used in layouts/menus).
*   `@upupa/authz` (for controlling element visibility based on permissions).
*   `@upupa/dynamic-form` (for form generation via decorators).
*   `@upupa/dialog` (used by `openFormDialog`).
*   `@upupa/data` (likely used by `adapterSubmit` and data filtering).

**Steps:**

1.  Install the library and its core dependencies (ensure all prerequisites listed above are also installed):

    ```bash
    npm install @upupa/cp @upupa/common @upupa/auth @upupa/authz @upupa/dynamic-form @upupa/dialog @upupa/data @angular/material @angular/cdk
    # or
    yarn add @upupa/cp @upupa/common @upupa/auth @upupa/authz @upupa/dynamic-form @upupa/dialog @upupa/data @angular/material @angular/cdk
    ```

2.  **Import Modules/Standalone Components:** Import `CpModule` or individual standalone components like `CpLayoutComponent` where needed. Ensure necessary Angular Material modules are also imported globally or where needed.

    ```typescript
    // Example in app.config.ts (standalone)
    import { ApplicationConfig, importProvidersFrom } from '@angular/core';
    import { provideAnimations } from '@angular/platform-browser/animations';
    import { MatSidenavModule } from '@angular/material/sidenav';
    import { MatToolbarModule } from '@angular/material/toolbar';
    // ... other imports

    export const appConfig: ApplicationConfig = {
      providers: [
        provideAnimations(),
        importProvidersFrom(
          // Import Material modules used by @upupa/cp components
          MatSidenavModule,
          MatToolbarModule,
          // ... other Material modules (MatIcon, MatButton, MatMenu etc.)
        ),
        // ... other providers (including auth, authz, dynamic-form, dialog, data)
      ],
    };
    ```

## Quick Start

### Using the CP Layout

Set up your main application routing to use `CpLayoutComponent` for your admin/control panel section.

1.  **Define Sidebar Items (Optional):** Provide configuration for the sidebar menu using the `CP_SIDE_BAR_ITEMS` token.

    ```typescript
    // Example provider in app.config.ts
    import { CP_SIDE_BAR_ITEMS, SideBarViewModel } from '@upupa/cp';

    const sideBarItems: SideBarViewModel = [
      {
        name: 'Dashboard',
        path: '/cp/dashboard',
        icon: 'dashboard'
      },
      {
        name: 'Management',
        icon: 'settings',
        children: [
          { name: 'Users', path: '/cp/users', icon: 'people' },
          { name: 'Products', path: '/cp/products', icon: 'inventory_2', authz: 'read:/products' } // Requires read permission
        ]
      }
    ];

    export const appConfig: ApplicationConfig = {
      providers: [
        // ... other providers
        { provide: CP_SIDE_BAR_ITEMS, useValue: sideBarItems }
      ],
    };
    ```

2.  **Configure Routes:** Use `CpLayoutComponent` as the parent component for your CP routes.

    ```typescript
    // Example app.routes.ts
    import { Routes } from '@angular/router';
    import { CpLayoutComponent } from '@upupa/cp';
    import { AuthGuard } from '@upupa/auth'; // Assuming you use auth guard

    export const appRoutes: Routes = [
      {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'cp', // Your control panel base path
        component: CpLayoutComponent,
        canActivate: [AuthGuard], // Protect the whole CP
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
          },
          {
            path: 'users',
            loadComponent: () => import('./users/users.component').then(m => m.UsersComponent)
          },
          {
            path: 'products',
            loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent)
            // Add canActivate: [AuthzGuard] if needed for specific feature authorization
          },
          // ... other cp routes
        ]
      },
      { path: '', redirectTo: '/cp', pathMatch: 'full' }, // Default route
      { path: '**', redirectTo: '/cp' } // Fallback route
    ];
    ```

### Opening a Form in a Dialog

Use the `@FormViewModel` decorator and the `openFormDialog` helper.

1.  **Define a FormViewModel:**

    ```typescript
    import { FormViewModel, formInput } from '@upupa/cp'; // Or from @upupa/dynamic-form

    @FormViewModel({ name: 'productForm' })
    export class ProductViewModel {
      @formInput({ label: 'Product Name', required: true })
      name: string;

      @formInput({ label: 'Price', input: 'number', required: true })
      price: number;

      // ... other fields
    }
    ```

2.  **Call `openFormDialog`:**

    ```typescript
    import { Component, inject } from '@angular/core';
    import { openFormDialog } from '@upupa/cp';
    import { ProductViewModel } from './product.viewmodel';
    import { MatDialog } from '@angular/material/dialog'; // Inject MatDialog

    @Component({ /* ... */ })
    export class ProductListComponent {
      readonly dialog = inject(MatDialog);

      addProduct() {
        const dialogRef = openFormDialog(this.dialog, {
          viewModel: ProductViewModel,
          dialogConfig: { title: 'Add New Product', width: '500px' },
          // initialValue: { name: 'Default Name' } // Optional initial value
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log('Product added/edited:', result);
            // Handle result (e.g., refresh list)
          }
        });
      }
    }
    ```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).