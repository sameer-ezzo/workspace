# @upupa/dynamic-form-material-theme

Provides an Angular Material theme for the `@upupa/dynamic-form` library.

This library contains a set of components built using Angular Material components that correspond to the standard input types used by `@upupa/dynamic-form`.

## Features

*   Implements dynamic form inputs using Angular Material components (`MatInput`, `MatSelect`, `MatDatepicker`, `MatCheckbox`, `MatRadio`, `MatSlideToggle`, etc.).
*   Exports `DF_MATERIAL_THEME_INPUTS`, a mapping used to register the theme components with `@upupa/dynamic-form`.
*   Provides a consistent Material Design look and feel for your dynamic forms.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@upupa/dynamic-form` installed and configured.
*   Angular Material (`@angular/material`, `@angular/cdk`) installed and configured.
*   `@eastdesire/jscolor` (used for color input).

**Steps:**

1.  Install the library and its dependencies:

    ```bash
    npm install @upupa/dynamic-form-material-theme @upupa/dynamic-form @angular/material @angular/cdk @eastdesire/jscolor
    # or
    yarn add @upupa/dynamic-form-material-theme @upupa/dynamic-form @angular/material @angular/cdk @eastdesire/jscolor
    ```

2.  **Import necessary Angular Material Modules:** Ensure you import the required Angular Material component modules into your application (e.g., `MatInputModule`, `MatSelectModule`, `MatDatepickerModule`, `MatCheckboxModule`, `MatRadioModule`, `MatSlideToggleModule`, etc.) based on the input types you intend to use.

    ```typescript
    // Example in app.config.ts (standalone)
    import { ApplicationConfig, importProvidersFrom } from '@angular/core';
    import { provideAnimations } from '@angular/platform-browser/animations';
    // Import necessary Material modules
    import { MatInputModule } from '@angular/material/input';
    import { MatFormFieldModule } from '@angular/material/form-field';
    import { MatSelectModule } from '@angular/material/select';
    import { MatDatepickerModule } from '@angular/material/datepicker';
    import { MatNativeDateModule } from '@angular/material/core'; // Or other date adapter
    import { MatCheckboxModule } from '@angular/material/checkbox';
    import { MatRadioModule } from '@angular/material/radio';
    import { MatSlideToggleModule } from '@angular/material/slide-toggle';
    // ... other required Material modules

    export const appConfig: ApplicationConfig = {
      providers: [
        provideAnimations(),
        importProvidersFrom(
          MatInputModule,
          MatFormFieldModule,
          MatSelectModule,
          MatDatepickerModule,
          MatNativeDateModule,
          MatCheckboxModule,
          MatRadioModule,
          MatSlideToggleModule,
          // ... other Material modules
        ),
        // ... other providers (including @upupa/dynamic-form configuration)
      ],
    };
    ```

## Usage

Register the theme components when providing the configuration for `@upupa/dynamic-form`.

```typescript
// Example in app.config.ts (standalone)
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideDynamicForm } from '@upupa/dynamic-form';
import { DF_MATERIAL_THEME_INPUTS } from '@upupa/dynamic-form-material-theme';
import { MatFormFieldModule } from '@angular/material/form-field';
// ... other imports

export const MATERIAL_THEME_NAME = 'material'; // Define a name for your theme

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(
      MatFormFieldModule,
      // ... other necessary Material modules
    ),
    provideDynamicForm(
      [], // Optional additional global providers
      {
        // Register the theme using the exported map
        [MATERIAL_THEME_NAME]: DF_MATERIAL_THEME_INPUTS
      },
      MATERIAL_THEME_NAME // Set this as the default theme to use
    )
    // ... other providers
  ],
};
```

Now, when you use `@upupa/dynamic-form` components (`DynamicFormComponent`, `DataFormComponent`, `CollectorComponent`), they will render form fields using the registered Angular Material components by default.

```typescript
// Example form scheme using standard types
const myFormScheme: FormScheme = {
  fields: {
    name: { input: 'text', label: 'Full Name' }, // Will render using MatInputComponent
    dob: { input: 'date', label: 'Date of Birth' }, // Will render using MatDateInputComponent
    category: { input: 'select', label: 'Category', adapter: { type: 'client', data: ['A', 'B'] } }, // Will render using MatSelectComponent
    subscribe: { input: 'switch', label: 'Subscribe?' } // Will render using MatSwitchComponent
    // ... etc
  }
};
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
