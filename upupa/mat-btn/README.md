# @upupa/mat-btn

A simple Angular component for rendering buttons based on `ActionDescriptor` objects, using Angular Material buttons.

## Features

*   **ActionDescriptor Driven:** Configure button appearance (text, icon, color, variant) and behavior (disabled state, authorization) using an `ActionDescriptor` object (from `@upupa/common`).
*   **Material Design:** Renders buttons using Angular Material components (`mat-button`, `mat-icon-button`, etc.) with support for standard variants (`stroked`, `flat`, `raised`, `icon`, `fab`, `mini-fab`) and colors (`primary`, `accent`, `warn`).
*   **Loading State:** Includes a `loading` input/model to easily display a progress spinner within the button.
*   **Authorization Integration:** Integrates with `@upupa/authz` to automatically disable/hide the button based on the `authz` property of the provided `ActionDescriptor`.
*   **Structured Event Output:** Emits a standardized `ActionEvent` object when clicked, containing the original event, the descriptor, and context/data.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   Angular Material (`@angular/material`, `@angular/cdk`) installed and configured.
*   `@upupa/common` (provides `ActionDescriptor` type).
*   `@upupa/authz` (required for authorization features).

**Steps:**

1.  Install the library and its peer dependencies:

    ```bash
    npm install @upupa/mat-btn @upupa/common @upupa/authz @angular/material @angular/cdk
    # or
    yarn add @upupa/mat-btn @upupa/common @upupa/authz @angular/material @angular/cdk
    ```
    *(Note: `@upupa/auth` might also be needed transitively via `@upupa/authz`)*

2.  **Import the Component:** Import the standalone `MatBtnComponent` where needed. Ensure necessary Angular Material modules (`MatButtonModule`, `MatIconModule`, `MatBadgeModule`, `MatProgressSpinnerModule`) are imported.

    ```typescript
    // Example in a feature component
    import { MatBtnComponent } from '@upupa/mat-btn';
    import { MatButtonModule } from '@angular/material/button';
    import { MatIconModule } from '@angular/material/icon';
    import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
    import { MatBadgeModule } from '@angular/material/badge';

    @Component({
      selector: 'app-my-actions',
      standalone: true,
      imports: [
        MatBtnComponent,
        // Required Material modules for MatBtnComponent:
        MatButtonModule,
        MatIconModule,
        MatBadgeModule,
        MatProgressSpinnerModule
      ],
      // ...
    })
    export class MyActionsComponent { }
    ```

## Usage

Use the `<mat-btn>` component in your template, providing an `ActionDescriptor` object to the `[buttonDescriptor]` input.

```html
<div class="button-container">
  <mat-btn [buttonDescriptor]="saveAction" [(loading)]="isSaving" (action)="handleAction($event)"></mat-btn>

  <mat-btn [buttonDescriptor]="deleteAction" [data]="currentItem" (action)="handleAction($event)"></mat-btn>

  <mat-btn [buttonDescriptor]="iconAction" (action)="handleAction($event)"></mat-btn>
</div>
```

```typescript
import { Component, signal } from '@angular/core';
import { ActionDescriptor, ActionEvent } from '@upupa/common';
import { MatBtnComponent } from '@upupa/mat-btn';
// Required Material imports for MatBtnComponent
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-button-example',
  standalone: true,
  imports: [
    MatBtnComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatBadgeModule
  ],
  templateUrl: './button-example.component.html' // Contains the HTML above
})
export class ButtonExampleComponent {

  isSaving = signal(false);
  currentItem = { id: 123, name: 'Example Item' };

  // Define Action Descriptors
  saveAction: ActionDescriptor = {
    name: 'save',
    text: 'Save Changes',
    color: 'primary',
    variant: 'raised',
    icon: 'save'
  };

  deleteAction: ActionDescriptor = {
    name: 'delete',
    text: 'Delete Item',
    color: 'warn',
    variant: 'stroked',
    icon: 'delete',
    authz: 'delete:/items' // Only enable/show if user has delete permission
  };

  iconAction: ActionDescriptor = {
    name: 'refresh',
    toolTip: 'Refresh Data',
    variant: 'icon',
    icon: 'refresh'
  };

  handleAction(event: ActionEvent) {
    console.log('Action triggered:', event.descriptor.name);
    console.log('Associated data:', event.data); // Logs currentItem for delete action

    if (event.descriptor.name === 'save') {
      this.isSaving.set(true);
      // Simulate save operation
      setTimeout(() => {
        this.isSaving.set(false);
        console.log('Save complete!');
      }, 2000);
    }
     else if (event.descriptor.name === 'delete') {
      // Confirm and delete event.data
      console.log('Deleting item:', event.data?.id)
    }
  }
}
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).