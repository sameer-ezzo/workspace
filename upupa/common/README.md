# @upupa/common

This library provides common utilities, services, components, directives, and pipes for Angular applications within the Upupa ecosystem.

## Overview

`@upupa/common` serves as a foundational module, centralizing shared frontend functionalities. It includes helpers for theming, event handling, local storage, logging, dynamic components, commonly used Angular Material modules, and various utility functions and pipes.

## Features

-   **Shared Angular Module (`UtilsModule`)**: Imports and re-exports common Angular modules (`CommonModule`, `FormsModule`, `ReactiveFormsModule`), essential Angular Material components, and custom utilities.
-   **Theming (`ThemeService`)**: Manages application themes (light/dark), detects OS preferences, applies theme classes to the root element, and persists selection in local storage.
-   **Event Bus (`EventBus`)**: Extends `@noah-ark/event-bus` for application-wide event communication. Includes integration for receiving messages from a browser service worker (likely for push notifications).
-   **Local Storage (`LocalStorageService`)**: Simple service for interacting with browser `localStorage`.
-   **Logging (`LoggerService`)**: Provides application logging capabilities.
-   **Base Components/Directives/Pipes**:
    -   `InputBaseComponent`: Potential base class for custom form controls.
    -   `PortalComponent`: Likely related to Angular Portals for rendering content dynamically.
    -   `HtmlPipe`: Sanitizes and renders HTML content.
    -   `MarkdownPipe`: Converts Markdown to HTML.
    -   `ErrorPipe`: Potentially formats or displays error messages.
    -   `FocusDirective`: Manages element focus.
    -   `OnlyNumberDirective`: Restricts input to numbers.
-   **Utility Functions**: Includes helpers like `toTitleCase`, `deepAssign`.
-   **Specialized Features**: Contains directories for routing helpers (`routing/`), metadata (`metadata/`), Server-Side Rendering (`ssr/`), View Transitions (`view-transitions/`), and potentially API gateway interaction (`gateway/`).

## Key Components

-   `UtilsModule`: The main Angular module to import.
-   `ThemeService`: Manages application themes.
-   `EventBus`: Handles application-wide events and service worker messages.
-   `LocalStorageService`: Interacts with local storage.
-   `LoggerService`: Provides logging.
-   `InputBaseComponent`: Base for form inputs.
-   `PortalComponent`: Dynamic content rendering.
-   `HtmlPipe`, `MarkdownPipe`, `ErrorPipe`: Common pipes.
-   `FocusDirective`, `OnlyNumberDirective`: Common directives.

## Dependencies

-   `@angular/core`, `@angular/common`, `@angular/forms`
-   `@angular/material` (various components like form-field, input, icon, button, select, snack-bar, dialog, tooltip, badge)
-   `@noah-ark/event-bus` (Base for `EventBus`)
-   `marked` (likely used by `MarkdownPipe`, needs verification)
-   `dompurify` (likely used by `HtmlPipe`, needs verification)

## Configuration

-   **`ThemeService`**: Initialized via `themeService.init(themes: Theme[], autoApplySystemTheme?: boolean)` where `themes` is an array defining theme names, CSS classes, and optionally `colorScheme` ('light'/'dark').

## Usage

**1. Import `UtilsModule`:**

Import `UtilsModule` into your shared module or feature modules where its components, directives, or pipes are needed.

```typescript
import { NgModule } from '@angular/core';
import { UtilsModule } from '@upupa/common';

@NgModule({
  imports: [
    UtilsModule,
    // ... other imports
  ],
  exports: [
    // ... components that use upupa/common features
  ]
})
export class MyFeatureModule {}
```

**2. Use Services:**
Inject services like `ThemeService`, `EventBus`, `LocalStorageService` into your components or other services.

```typescript
import { Component, OnInit } from '@angular/core';
import { ThemeService, Theme } from '@upupa/common';

@Component({
  selector: 'app-settings',
  template: `
    <select (change)="applyTheme($event)">
      <option *ngFor="let theme of themeService.themes"
              [value]="theme.name"
              [selected]="theme.name === themeService.selectedTheme?.name">
        {{ theme.name }}
      </option>
    </select>
  `
})
export class SettingsComponent implements OnInit {
  constructor(public themeService: ThemeService) {}

  ngOnInit() {
    // Example initialization (typically done in AppComponent or a core module)
    // const appThemes: Theme[] = [
    //   { name: 'Light', className: ['theme-light'], colorScheme: 'light' },
    //   { name: 'Dark', className: ['theme-dark'], colorScheme: 'dark' }
    // ];
    // this.themeService.init(appThemes);
  }

  applyTheme(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.themeService.apply(selectElement.value);
  }
}
```

**3. Use Pipes/Directives:**
Apply pipes and directives in your component templates.

```html
<!-- Sanitize and render HTML -->
<div [innerHTML]="unsafeHtml | html"></div>

<!-- Convert Markdown -->
<div [innerHTML]="markdownContent | markdown"></div>

<!-- Only allow numbers -->
<input type="text" upupaOnlyNumber>

<!-- Auto focus -->
<input type="text" upupaFocus>
```

## License

This library needs a `LICENSE`