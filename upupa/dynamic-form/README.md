# @upupa/dynamic-form

A library for dynamically generating forms in Angular applications.

## Features

*   Generate forms based on a configuration object (schema).
*   Supports different input types.
*   Themable component structure (requires a theme implementation, e.g., `@upupa/dynamic-form-native-theme`).
*   Conditional logic for fields.
*   Data collection capabilities (likely via `CollectorComponent` or `DataFormComponent`).

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   A theme implementation (e.g., `@upupa/dynamic-form-native-theme`).

**Steps:**

1.  Install the core library and a theme (e.g., native theme):

    ```bash
    npm install @upupa/dynamic-form @upupa/dynamic-form-native-theme
    # or
    yarn add @upupa/dynamic-form @upupa/dynamic-form-native-theme
    ```

2.  Configure the library in your application (e.g., `app.config.ts` for standalone apps):

    ```typescript
    import { ApplicationConfig, importProvidersFrom } from '@angular/core';
    import { provideRouter } from '@angular/router';
    import { provideHttpClient } from '@angular/common/http';
    import { provideDynamicForm } from '@upupa/dynamic-form';
    import { DF_NATIVE_THEME_INPUTS, NATIVE_THEME_NAME } from '@upupa/dynamic-form-native-theme';

    import { appRoutes } from './app.routes';

    export const appConfig: ApplicationConfig = {
      providers: [
        provideRouter(appRoutes),
        provideHttpClient(), // Required if using features that need HTTP
        provideDynamicForm(
          [], // Optional additional global providers for form inputs/features
          { [NATIVE_THEME_NAME]: DF_NATIVE_THEME_INPUTS }, // Register themes
          NATIVE_THEME_NAME // Set default theme
          // { enableLogs: true } // Optional configuration
        )
      ],
    };
    ```

## Quick Start

1.  **Import necessary components:** Import `DynamicFormComponent` or `DataFormComponent` into your component. Ensure your component is standalone or belongs to a module that imports the necessary components/modules.

    ```typescript
    import { Component } from '@angular/core';
    import { DynamicFormComponent } from '@upupa/dynamic-form'; // Or DataFormComponent
    import { FormScheme } from '@upupa/dynamic-form'; // Import necessary types

    @Component({
      selector: 'app-my-feature',
      standalone: true,
      imports: [DynamicFormComponent], // Import the component
      template: `
        <h2>Dynamic Form Example</h2>
        <upupa-dynamic-form [scheme]="formScheme" (valueChange)="onFormValueChange($event)"></upupa-dynamic-form>
        <pre>{{ formData | json }}</pre>
      `,
    })
    export class MyFeatureComponent {
      formScheme: FormScheme = { // Define your form structure here
        fields: {
          name: { type: 'text', name: 'name', label: 'Full Name', required: true },
          email: { type: 'email', name: 'email', label: 'Email Address' },
          age: { type: 'number', name: 'age', label: 'Age', min: 18 },
          // Add more fields as needed based on your theme's supported types
        },
        // Add other form-level configurations if needed
      };

      formData: any = {};

      onFormValueChange(value: any) {
        this.formData = value;
        console.log('Form Value:', value);
      }
    }
    ```

2.  **Define the Form Schema:** Create a `FormScheme` object that defines the fields, types, validations, and layout of your form. The available `type` values depend on the registered theme (`@upupa/dynamic-form-native-theme` in this example).

3.  **Use the Component:** Add the `<upupa-dynamic-form>` (or `<upupa-data-form>`) tag to your template, binding the `scheme` input and optionally listening to `valueChange` or other outputs.

*Note: This is a basic example. Explore the exported types (`FormScheme`, `Field`, etc.) and components (`CollectorComponent`, `DataFormComponent`) for more advanced usage.*

## More Examples / Common Tasks

### 1. Defining Forms with Decorators (`DataFormComponent`)

Instead of manually creating the `FormScheme` object, you can define your form structure using decorators within a ViewModel class. The `DataFormComponent` is often used in this scenario as it can directly consume the ViewModel type.

**a. Define the ViewModel:**

```typescript
import { FormViewModel, createButton, formInput, formAction, reflectFormViewModelType } from '@upupa/dynamic-form';
import { Validators } from '@angular/forms'; // Import Angular Validators if needed

@FormViewModel({ // Use @FormViewModel() or @formScheme()
  // Form-level options can go here
  name: 'userProfileForm'
})
export class UserProfileViewModel {

  @formInput({ label: 'Username', required: true, validators: [/* Angular Validators.required */] })
  userName: string;

  @formInput({ label: 'Email', input: 'email', required: true, validators: [/* Validators.required, Validators.email */] })
  email: string;

  @formInput({ label: 'Receive Newsletter?', input: 'switch' })
  newsletter: boolean = false;

  // Field shown only if newsletter is true (See Conditional Example)
  @formInput({ label: 'Newsletter Frequency', input: 'select',
               adapter: { type: 'client', data: ['Daily', 'Weekly', 'Monthly'] },
               hidden: true // Initially hidden
             })
  newsletterFrequency: string;

  @formAction({ text: 'Save Profile', type: 'submit', color: 'primary' })
  onSubmit() {
    console.log('Submitting:', this);
    // Return data or a Promise/Observable for async operations
    return { userName: this.userName, email: this.email, newsletter: this.newsletter, newsletterFrequency: this.newsletterFrequency };
  }
}
```

**b. Use `DataFormComponent` in your component:**

```typescript
import { Component } from '@angular/core';
import { DataFormComponent } from '@upupa/dynamic-form';
import { UserProfileViewModel } from './user-profile.viewmodel'; // Import the ViewModel

@Component({
  selector: 'app-profile-editor',
  standalone: true,
  imports: [DataFormComponent], // Import DataFormComponent
  template: `
    <h2>Edit Profile</h2>
    <upupa-data-form
      [viewModel]="UserProfileViewModel"
      [value]="initialProfileData"
      (valueChange)="onProfileChange($event)"
      (action)="handleAction($event)">
    </upupa-data-form>
    <pre>Current Value: {{ currentProfileData | json }}</pre>
  `
})
export class ProfileEditorComponent {
  UserProfileViewModel = UserProfileViewModel; // Make type available in template

  initialProfileData = {
    userName: 'DefaultUser',
    email: 'user@example.com'
  };
  currentProfileData = { ...this.initialProfileData };

  onProfileChange(value: any) {
    this.currentProfileData = value;
    console.log('Profile Updated:', value);
  }

  handleAction(event: { action: any, data: any }) {
    console.log('Action Triggered:', event.action.name);
    if (event.action.name === 'onSubmit') {
      // Data is already in event.data if the action returned it
      console.log('Submitted Data:', event.data);
      alert('Profile Saved!');
    }
  }
}

```

### 2. Conditional Field Visibility

You can control the visibility of fields based on the values of other fields using conditions. Conditions are typically defined at the form level.

**a. Define conditions in `provideDynamicForm` or `@formScheme`:**

Conditions use an expression syntax. You'll likely need to provide the `ConditionalLogicService` and potentially related services from `@noah-ark/expression-engine` if not already provided globally.

```typescript
// In your app configuration (e.g., app.config.ts)
import { provideDynamicForm } from '@upupa/dynamic-form';
// ... other imports

provideDynamicForm(
  [/* other providers */],
  { [NATIVE_THEME_NAME]: DF_NATIVE_THEME_INPUTS },
  NATIVE_THEME_NAME,
  {
    // Define conditions globally if needed
    conditions: [
      {
        name: 'showNewsletterFrequency',
        // Expression: '$model.newsletter === true'
        // The exact expression syntax depends on @noah-ark/expression-engine
        // This condition evaluates to true if the 'newsletter' field is true
        expression: '!!$model.newsletter'
      }
    ]
  }
)
```

**b. Associate the condition with a field:**

Reference the condition name in the field definition (either in the `FormScheme` object or `@formInput` options).

```typescript
// In your FormScheme object:
const formScheme: FormScheme = {
  fields: {
    // ... other fields
    newsletter: { type: 'switch', name: 'newsletter', label: 'Receive Newsletter?' },
    newsletterFrequency: {
      type: 'select',
      name: 'newsletterFrequency',
      label: 'Newsletter Frequency',
      adapter: { type: 'client', data: ['Daily', 'Weekly', 'Monthly'] },
      // Apply the condition
      condition: { name: 'showNewsletterFrequency', mode: 'visible' } // 'visible' or 'hidden'
    }
  }
};

// Or using decorators (@formInput):
@formInput({
  label: 'Newsletter Frequency',
  input: 'select',
  adapter: { type: 'client', data: ['Daily', 'Weekly', 'Monthly'] },
  // Apply the condition
  condition: { name: 'showNewsletterFrequency', mode: 'visible' }
})
newsletterFrequency: string;
```

When the `newsletter` field value changes, the visibility of the `newsletterFrequency` field will automatically update based on the `showNewsletterFrequency` condition.

### 3. Multi-Step Form (`CollectorComponent`)

The `CollectorComponent` allows you to break down large forms into multiple pages or steps.

```typescript
import { Component, model } from '@angular/core';
import { CollectorComponent } from '@upupa/dynamic-form';
import { FormScheme } from '@upupa/dynamic-form';

@Component({
  selector: 'app-signup-wizard',
  standalone: true,
  imports: [CollectorComponent], // Import CollectorComponent
  template: `
    <h2>Signup Wizard - Step {{ currentPage() + 1 }}</h2>
    <collector
      [fields]="signupScheme"
      [(value)]="signupData"
      [(activePage)]="currentPage"
      (submit)="onFinalSubmit($event)">
    </collector>
    <pre>Current Data: {{ signupData | json }}</pre>
    <p>Current Page: {{ currentPage() }}</p>
  `
})
export class SignupWizardComponent {
  currentPage = model(0); // Use Angular signal model for two-way binding

  signupData = {};

  signupScheme: FormScheme = {
    // Define fields for all steps here
    // Use 'pageBreak' property or rely on CollectorComponent's styling
    fields: {
      // Step 1
      username: { type: 'text', name: 'username', label: 'Username', required: true, group: 'account' },
      password: { type: 'password', name: 'password', label: 'Password', required: true, group: 'account' },

      // Step 2 - Fields implicitly go to the next page if using 'linear' style
      firstName: { type: 'text', name: 'firstName', label: 'First Name', required: true, group: 'profile' },
      lastName: { type: 'text', name: 'lastName', label: 'Last Name', group: 'profile' },

      // Step 3
      terms: { type: 'switch', name: 'terms', label: 'Agree to Terms', required: true, group: 'final'}
    },
    groups: {
      account: {name: 'account', template: 'expansion', inputs: {label: 'Account Info'}},
      profile: {name: 'profile', template: 'expansion', inputs: {label: 'Profile Info'}},
      final: {name: 'final', template: 'expansion', inputs: {label: 'Confirmation'}}
    }
  };

  onFinalSubmit(value: any) {
    console.log('Wizard Submitted:', value);
    alert('Signup Complete!');
  }
}
```

The `CollectorComponent` internally uses `DynamicFormComponent` but adds the pagination controls (Next/Previous buttons are typically default unless customized via inputs like `nextBtn`, `prevBtn`) and manages showing/hiding fields based on the `activePage`.

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
