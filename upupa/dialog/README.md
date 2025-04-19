# @upupa/dialog

A library for displaying dialogs and snackbars in Angular applications, built on top of Angular Material.

## Features

*   **Service-Based API:** Open dialogs and snackbars using injectable services (`DialogService`, `SnackBarService`).
*   **Dynamic Content:** Display any Angular component or template within a dialog.
*   **Configuration:** Customize dialog appearance and behavior (size, position, title, header/footer, etc.).
*   **Dialog Reference:** Interact with opened dialogs via `DialogRef` (e.g., get results when closed).
*   **Pre-built Dialogs:** Includes common dialogs like `Confirm` and `Prompt` with dedicated services and components.
*   **Snackbar Helpers:** Convenience methods for showing success, error, warning, info, and confirmation snackbars.
*   **Wrapper around Angular Material:** Leverages `MatDialog` and `MatSnackBar` internally.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   Angular Material (`@angular/material`, `@angular/cdk`) installed and configured in your project, as this library relies heavily on it.
*   `@upupa/common` for dynamic template handling.

**Steps:**

1.  Install the library and its peer dependencies:

    ```bash
    npm install @upupa/dialog @upupa/common @angular/material @angular/cdk
    # or
    yarn add @upupa/dialog @upupa/common @angular/material @angular/cdk
    ```

2.  **Import necessary Angular Material Modules:** Ensure you have imported `MatDialogModule` and `MatSnackBarModule` in your application (e.g., in `app.config.ts` providers or your root module).

    ```typescript
    // Example in app.config.ts (standalone)
    import { ApplicationConfig, importProvidersFrom } from '@angular/core';
    import { provideAnimations } from '@angular/platform-browser/animations';
    import { MatDialogModule } from '@angular/material/dialog';
    import { MatSnackBarModule } from '@angular/material/snack-bar';

    export const appConfig: ApplicationConfig = {
      providers: [
        provideAnimations(), // Required for Angular Material
        importProvidersFrom(MatDialogModule, MatSnackBarModule),
        // ... other providers
      ],
    };
    ```

3.  **Include Styles (Optional but Recommended):** The library might provide base styling. Check if a CSS/SCSS file needs to be included (e.g., `package.json` indicates an export for `src/styles.scss`). You might need to add it to your `angular.json` styles array or import it into your global stylesheet.

    ```json
    // angular.json (example)
    "styles": [
      "node_modules/@angular/material/prebuilt-themes/indigo-pink.css",
      "src/styles.scss",
      "libs/workspace/upupa/dialog/src/styles.scss" // Add this if applicable
    ],
    ```

## Quick Start

### Opening a Custom Dialog

1.  **Create a Dialog Component:**

    ```typescript
    import { Component, inject } from '@angular/core';
    import { DialogRef } from '@upupa/dialog'; // Import DialogRef
    import { MAT_DIALOG_DATA } from '@angular/material/dialog'; // Inject data

    @Component({
      selector: 'app-my-dialog',
      standalone: true,
      template: `
        <h2>{{ data.title }}</h2>
        <p>{{ data.message }}</p>
        <button (click)="closeDialog(true)">OK</button>
        <button (click)="closeDialog(false)">Cancel</button>
      `
    })
    export class MyDialogComponent {
      // Inject DialogRef and optional data
      readonly dialogRef = inject(DialogRef<MyDialogComponent, boolean>);
      readonly data: { title: string, message: string } = inject(MAT_DIALOG_DATA);

      closeDialog(result: boolean): void {
        this.dialogRef.close(result);
      }
    }
    ```

2.  **Use `DialogService` to Open:**

    ```typescript
    import { Component, inject } from '@angular/core';
    import { DialogService } from '@upupa/dialog';
    import { MyDialogComponent } from './my-dialog/my-dialog.component';

    @Component({
      selector: 'app-feature',
      standalone: true,
      template: '<button (click)="openCustomDialog()">Open Custom Dialog</button>'
    })
    export class FeatureComponent {
      readonly dialogService = inject(DialogService);

      openCustomDialog(): void {
        const dialogRef = this.dialogService.open<MyDialogComponent, { title: string, message: string }, boolean>(
          MyDialogComponent, // Component to open
          {
            title: 'Custom Dialog Title', // Can be used by DialogWrapperComponent
            data: { // Data to pass to MyDialogComponent via MAT_DIALOG_DATA
              title: 'Confirmation',
              message: 'Are you sure you want to proceed?'
            },
            width: '400px'
          }
        );

        dialogRef.afterClosed().subscribe(result => {
          console.log('Dialog closed with result:', result); // true or false in this case
        });
      }
    }
    ```

### Using `SnackBarService`

Inject `SnackBarService` and call its methods.

```typescript
import { Component, inject } from '@angular/core';
import { SnackBarService } from '@upupa/dialog';

@Component({
  selector: 'app-action-buttons',
  standalone: true,
  template: `
    <button (click)="showSuccess()">Show Success</button>
    <button (click)="showError()">Show Error</button>
  `
})
export class ActionButtonsComponent {
  readonly snackBarService = inject(SnackBarService);

  showSuccess(): void {
    this.snackBarService.openSuccess('Operation completed successfully!');
  }

  showError(): void {
    this.snackBarService.openFailed('Operation failed.', { message: 'Server connection timeout' });
  }
}
```

## More Examples

### Using Pre-built Confirm Dialog

```typescript
import { Component, inject } from '@angular/core';
import { ConfirmService, ConfirmConfig } from '@upupa/dialog'; // Import ConfirmService

@Component({
  selector: 'app-delete-item',
  standalone: true,
  template: '<button (click)="confirmDelete()">Delete Item</button>'
})
export class DeleteItemComponent {
  readonly confirmService = inject(ConfirmService);

  confirmDelete(): void {
    const config: ConfirmConfig = {
      title: 'Confirm Deletion',
      message: 'Are you absolutely sure you want to delete this item?',
      confirmText: 'Yes, Delete',
      cancelText: 'No, Keep It'
    };

    this.confirmService.open(config).subscribe(confirmed => {
      if (confirmed) {
        console.log('Item deletion confirmed.');
        // Proceed with deletion logic
      }
    });
  }
}
```

*(Similar examples can be created for `PromptService`)*

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
