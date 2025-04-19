# @upupa Frontend Libraries

This directory contains a collection of Angular libraries (`@upupa/*`) designed to provide reusable UI components, services, and utilities for building frontend applications within this workspace.

## Overview

The `@upupa` libraries likely form the core of the frontend infrastructure, offering features such as:

-   **UI Components**: Based heavily on Angular Material (indicated by `mat-btn`, `dynamic-form-material-theme`), providing components like tables, dialogs, popovers, buttons, tags, etc.
-   **Dynamic Forms**: A significant focus on dynamic form generation (`@upupa/dynamic-form`) with theme support.
-   **Authentication & Authorization**: Frontend counterparts (`@upupa/auth`, `@upupa/authz`, `@upupa/permissions`, `@upupa/membership`) to the backend's `@ss/auth` and `@ss/rules`, handling user sessions, UI guards, and permission checks.
-   **Data Handling**: Utilities (`@upupa/data`) possibly for state management or interacting with backend APIs.
-   **Common Utilities**: Foundational services, directives, pipes, and helpers (`@upupa/common`).
-   **Specialized Features**: Libraries for file uploads (`@upupa/upload`), rich text editing (`@upupa/html-editor`, `@upupa/editor-js`), internationalization (`@upupa/language`), and potentially custom widgets (`@upupa/widget`).

## Key Libraries

Here's a brief overview of the likely purpose of each library based on its name:

-   `@upupa/common`: Foundational utilities, services, base components, directives, pipes. (See its README for details)
-   `@upupa/dynamic-form`: Core library for generating forms dynamically from configuration.
-   `@upupa/dynamic-form-material-theme`: Material Design theme/components for `@upupa/dynamic-form`.
-   `@upupa/dynamic-form-native-theme`: Basic/native theme/components for `@upupa/dynamic-form`.
-   `@upupa/auth`: Handles frontend authentication logic (login forms, token storage, session management).
-   `@upupa/authz`: Likely provides directives or services for checking authorization/permissions in the UI.
-   `@upupa/permissions`: Related to managing or displaying user permissions.
-   `@upupa/membership`: Handle user profiles, group/team management, or related features.
-   `@upupa/table`: Provides a configurable data table component.
-   `@upupa/data`: Frontend data services, possibly for state management or API interaction helpers.
-   `@upupa/upload`: Components and services for handling file uploads.
-   `@upupa/dialog`: Service and components for displaying modal dialogs.
-   `@upupa/popover`: Components for displaying popovers.
-   `@upupa/tags`: Component for displaying or inputting tags.
-   `@upupa/mat-btn`: Specialized Material button components or extensions.
-   `@upupa/html-editor` / `@upupa/editor-js`: Rich text editor components.
-   `@upupa/language`: Internationalization (i18n) utilities or components.
-   `@upupa/widget`: Generic widget components or framework.
-   `@upupa/cp`: (Purpose unclear from name, might be "Control Panel" or "Component Parts").

## Usage

The `@upupa` libraries are designed to be integrated into the Angular frontend applications within this workspace (e.g., `crow-vista-ng`, `verifysy-ng`). To use a specific library's features:

1.  **Identify the Feature:** Determine which `@upupa` library provides the component, service, or utility you need (e.g., `@upupa/table` for a data table).
2.  **Import:** Import the necessary Angular module (e.g., `UpupaTableModule`) or standalone component/service/directive/pipe from the library into your application module or component.
3.  **Integrate:** Use the imported component in your templates, inject the service into your components, or apply the directive/pipe as needed.

**Conceptual Example (Using `@upupa/table`):**

```typescript
// Example: In your application's feature module (e.g., apps/crow-vista/crow-vista-ng/src/app/features/my-data/my-data.module.ts)
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpupaTableModule } from '@upupa/table'; // Assuming table has a module
import { MyDataTableComponent } from './my-data-table.component';

@NgModule({
  declarations: [MyDataTableComponent],
  imports: [
    CommonModule,
    UpupaTableModule // Import the module from the library
  ],
  exports: [MyDataTableComponent]
})
export class MyDataModule {}

// Example: In your component template (my-data-table.component.html)
// Assuming <upupa-table> is the selector for the table component
<upupa-table
  [data]="myData"
  [columns]="myColumns"
  (rowClick)="onRowClicked($event)">
</upupa-table>
```

**Important:** This is a conceptual example. The actual module names, component selectors, inputs, and outputs will vary for each library.

**Always refer to the specific `README.md` file within each `@upupa/*` library's directory for detailed installation (if any beyond workspace setup), configuration, API documentation, and concrete usage examples.**