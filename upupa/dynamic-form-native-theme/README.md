# @upupa/dynamic-form-native-theme

Provides a native HTML theme for the `@upupa/dynamic-form` library.

This library contains a set of components built using standard HTML form elements (`<input>`, `<select>`, `<textarea>`, etc.) or minimal custom components that correspond to the standard input types used by `@upupa/dynamic-form`.

## Features

*   Implements dynamic form inputs using native HTML elements or basic components.
*   Exports `DF_NATIVE_THEME_INPUTS`, a mapping used to register the theme components with `@upupa/dynamic-form`.
*   Provides a default, unstyled or minimally styled appearance for dynamic forms, suitable for applications not using a specific component library like Angular Material or for further customization.
*   Includes components for various input types like text, number, date, select, checkbox, radio, file uploads, etc.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@upupa/dynamic-form` installed and configured.
*   `@upupa/common` (likely used by some input components).
*   `@upupa/upload` and `@upupa/table` (seemingly used by array/file input components).

**Steps:**

1.  Install the library and its dependencies:

    ```bash
    npm install @upupa/dynamic-form-native-theme @upupa/dynamic-form @upupa/common @upupa/upload @upupa/table
    # or
    yarn add @upupa/dynamic-form-native-theme @upupa/dynamic-form @upupa/common @upupa/upload @upupa/table
    ```
    *(Note: Review if all listed dependencies like `@upupa/upload` and `@upupa/table` are strictly required or only needed for specific input types like `array` or `file`)*

2.  **Import Module/Components (Optional):** While registration often happens via providers, you might need to import `DynamicFormNativeThemeModule` or specific standalone input components if you are using them directly or if they are not automatically handled by the provider setup.

## Usage

Register the theme components when providing the configuration for `@upupa/dynamic-form`. This theme is often used as the default or fallback theme.

```typescript
// Example in app.config.ts (standalone)
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations'; // Still might be needed by sub-dependencies
import { provideDynamicForm } from '@upupa/dynamic-form';
import { DF_NATIVE_THEME_INPUTS, NATIVE_THEME_NAME } from '@upupa/dynamic-form-native-theme';
// ... other imports

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(), // Check if needed
    provideHttpClient(),
    provideDynamicForm(
      [], // Optional additional global providers
      {
        // Register the theme using the exported map and name
        [NATIVE_THEME_NAME]: DF_NATIVE_THEME_INPUTS
        // You could also register other themes here, e.g., Material
        // [MATERIAL_THEME_NAME]: DF_MATERIAL_THEME_INPUTS
      },
      NATIVE_THEME_NAME // Set native as the default theme
    )
    // ... other providers
  ],
};
```

Now, when you use `@upupa/dynamic-form` components (`DynamicFormComponent`, `DataFormComponent`, `CollectorComponent`), they will render form fields using the registered native components by default.

```typescript
// Example form scheme using standard types
const myFormScheme: FormScheme = {
  fields: {
    firstName: { input: 'text', label: 'First Name' }, // Renders using native InputComponent
    country: { input: 'select', label: 'Country', adapter: { type: 'client', data: ['USA', 'Canada'] } }, // Renders using native SelectComponent
    notes: { input: 'textarea', label: 'Notes' }, // Renders using native TextAreaComponent
    agree: { input: 'switch', label: 'Agree to Terms?' } // Renders using native SwitchComponent (might be checkbox styled as switch)
    // ... etc
  }
};
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
