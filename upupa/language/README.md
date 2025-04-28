# @upupa/language

An Angular library for handling internationalization (i18n), including translation loading, language management, and text direction.

## Features

*   **Translation Management (`TranslateService`):**
    *   Loads language-specific translation files (JSON format) from a configured URL.
    *   Provides `translate` (synchronous) and `translate$` (asynchronous) methods to retrieve translated strings by key.
    *   Supports basic interpolation using `$0`, `$1`, etc. for parameters.
*   **Language Management (`LanguageService`):**
    *   Tracks the current application language.
    *   Detects language from the URL route parameter (configurable name).
    *   Falls back to a default language.
    *   Determines and applies text direction (LTR/RTL) to the HTML document.
    *   Provides `language$` and `dir$` observables to react to changes.
*   **Translation Pipe (`TextPipe`):** Translates keys directly within Angular component templates.
*   **Configurable:** Use DI tokens to set the default language, route variable name, and translation file URL.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@angular/common/http` for fetching translation files.

**Steps:**

1.  Install the library:

    ```bash
    npm install @upupa/language
    # or
    yarn add @upupa/language
    ```

2.  **Provide Configuration:** Configure the library in your application providers (e.g., `app.config.ts`) using the exported DI tokens.

    ```typescript
    // Example in app.config.ts (standalone)
    import { ApplicationConfig } from '@angular/core';
    import { provideHttpClient } from '@angular/common/http';
    import { provideRouter } from '@angular/router';
    import { DEFAULT_LANG, ROUTE_VARIABLE_NAME, DICTIONARIES_URL } from '@upupa/language';
    import { appRoutes } from './app.routes'; // Your app routes

    export const appConfig: ApplicationConfig = {
      providers: [
        provideHttpClient(),
        provideRouter(appRoutes), // Ensure router is provided
        {
          provide: DEFAULT_LANG,
          useValue: 'en' // Your default language code
        },
        {
          provide: ROUTE_VARIABLE_NAME,
          useValue: 'lang' // The route parameter name, e.g., /en/home, /ar/home
        },
        {
          provide: DICTIONARIES_URL,
          // Path relative to your assets folder where dictionaries are stored
          useValue: '/assets/i18n'
        }
        // ... other providers
      ],
    };
    ```

3.  **Structure Routes (Optional but Recommended):** If using route-based language detection, structure your routes to include the language parameter.

    ```typescript
    // Example app.routes.ts
    import { Routes } from '@angular/router';

    export const appRoutes: Routes = [
      {
        // Match routes with a language code (e.g., /en/dashboard)
        path: ':lang', // Must match ROUTE_VARIABLE_NAME
        children: [
          { path: '', redirectTo: 'home', pathMatch: 'full' },
          {
            path: 'home',
            loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
          },
          // ... other language-scoped routes
        ]
      },
      // Redirect root path to default language route
      { path: '', redirectTo: '/en', pathMatch: 'full' }, // Use your DEFAULT_LANG
      // Fallback route (optional)
      { path: '**', redirectTo: '/en' } // Use your DEFAULT_LANG
    ];
    ```

4.  **Prepare Translation Files:** Create JSON files for each language in the configured `DICTIONARIES_URL` path (e.g., `/assets/i18n/en.json`, `/assets/i18n/ar.json`).

    ```json
    // Example /assets/i18n/en.json
    {
      "GREETING": "Hello, $0!",
      "WELCOME_MESSAGE": "Welcome to the application."
    }
    ```

    ```json
    // Example /assets/i18n/ar.json
    {
      "GREETING": "مرحباً يا $0!",
      "WELCOME_MESSAGE": "أهلاً بك في التطبيق."
    }
    ```

## Usage

### Using the `TextPipe` in Templates

```html
<!-- Assuming current language is 'en' -->
<h1>{{ 'GREETING' | text:userName }}</h1> <!-- Output: Hello, User Name! -->
<p>{{ 'WELCOME_MESSAGE' | text }}</p>  <!-- Output: Welcome to the application. -->
```

```typescript
import { Component } from '@angular/core';
import { TextPipe } from '@upupa/language'; // Import if standalone
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-greeting',
  standalone: true,
  imports: [CommonModule, TextPipe],
  templateUrl: './greeting.component.html' // Contains the HTML above
})
export class GreetingComponent {
  userName = 'User Name';
}
```

### Using `TranslateService` in Components

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { TranslateService } from '@upupa/language';
import { Observable } from 'rxjs';

@Component({ /* ... */ })
export class InfoComponent implements OnInit {
  readonly translateService = inject(TranslateService);

  welcomeMessage$: Observable<string>;
  syncGreeting: string;

  ngOnInit() {
    // Asynchronous translation (recommended)
    this.welcomeMessage$ = this.translateService.translate$('WELCOME_MESSAGE');

    // Synchronous translation (use cautiously, may not have loaded yet)
    this.syncGreeting = this.translateService.translate('GREETING', undefined, 'Component User');
  }
}
```

### Using `LanguageService`

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { LanguageService } from '@upupa/language';
import { Direction } from './iso.languages'; // Import Direction type if needed
import { Observable } from 'rxjs';

@Component({ /* ... */ })
export class LangInfoComponent implements OnInit {
  readonly languageService = inject(LanguageService);

  currentLang: string;
  direction$: Observable<Direction>;

  ngOnInit() {
    this.currentLang = this.languageService.language; // Get current sync language
    this.direction$ = this.languageService.dir$; // Observe direction changes

    this.languageService.language$.subscribe(lang => {
      console.log('Language changed to:', lang);
      this.currentLang = lang;
    });
  }
}
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
