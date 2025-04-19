# @upupa/common

A foundational library for Angular applications, providing a collection of common utilities, directives, pipes, services, and base components used across the `@upupa` ecosystem.

## Features

**UI & Components:**

*   **Dynamic Component Loading:** `PortalComponent` to render components dynamically based on configuration (`DynamicComponent` type).
*   **UI Directives:** Helpers for input validation (`upupaEqual`, `upupaMax`, `upupaMin`, `upupaOnlyNumbers`), UI behavior (`longPress`, `upupaFocus`, `upupaErrors`), and navigation (`navigateTo`).
*   **Pipes:** Safely render HTML (`safeHtml`) or Markdown (`markdown`).
*   **Base Components:** `InputBaseComponent` for building custom form controls compatible with Angular Forms.

**Services & Utilities:**

*   **Event Bus:** `EventBus` service for decoupled communication between application parts.
*   **Storage:** `LocalStorageService` for interacting with browser local storage.
*   **Theming:** `ThemeService` (likely for managing application themes).
*   **Logging:** `Logger` service.
*   **Metadata:** `MetadataService` and strategies (Open Graph, Twitter, Schema.org) for managing page metadata (SEO, social sharing).
*   **Core Utilities:** String formatting (`toTitleCase`), deep object merging (`deepAssign`), and other miscellaneous utilities.

**Routing & Advanced:**

*   **Routing Helpers:** Utilities for binding route data (`RouteOutputBinder`), declarative navigation (`NavigateToDirective`), route reuse strategies (`ReuseAllStrategy`), preloading, resolvers, and more.
*   **SSR Support:** Helpers and tokens related to server-side rendering (`ssr/`).
*   **View Transitions:** Utilities for working with the View Transitions API (`view-transitions/`).

**Types:**

*   Shared types like `ActionDescriptor` (used for defining actions/buttons) and `DynamicComponent` (for configuring dynamic components).

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).

**Steps:**

1.  Install the library:

    ```bash
    npm install @upupa/common
    # or
    yarn add @upupa/common
    ```

2.  **Import Modules/Standalone Components:** Import `UtilsModule` or individual standalone components, directives, and pipes where needed.

    ```typescript
    // Example in a standalone component:
    import { PortalComponent, NavigateToDirective, MarkdownPipe } from '@upupa/common';

    @Component({
      selector: 'app-my-feature',
      standalone: true,
      imports: [
        PortalComponent,     // For dynamic components
        NavigateToDirective, // For declarative navigation
        MarkdownPipe         // For rendering markdown
        // ... other necessary imports
      ],
      // ...
    })
    export class MyFeatureComponent { }
    ```

3.  **Include Styles (Optional):** If the library provides global styles (`src/styles.scss`), include them in your `angular.json` or global stylesheet.

## Quick Start

### Dynamic Component Loading (`PortalComponent`)

Render a component dynamically based on configuration.

```typescript
// my-feature.component.ts
import { Component } from '@angular/core';
import { PortalComponent, DynamicComponent } from '@upupa/common';
import { SomeOtherComponent } from './some-other/some-other.component';

@Component({
  selector: 'app-my-feature',
  standalone: true,
  imports: [PortalComponent, SomeOtherComponent],
  template: `
    <h2>Dynamic Section</h2>
    <upupa-portal [component]="dynamicConfig"></upupa-portal>
  `
})
export class MyFeatureComponent {
  dynamicConfig: DynamicComponent = {
    component: SomeOtherComponent,
    inputs: {
      title: 'Loaded Dynamically!',
      someValue: 123
    },
    // outputs: {
    //   someOutput: (event) => console.log('Output received:', event)
    // }
  };
}

// some-other.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-some-other',
  standalone: true,
  template: '<h3>{{ title }}</h3><p>Value: {{ someValue }}</p>'
})
export class SomeOtherComponent {
  @Input() title = 'Default Title';
  @Input() someValue: number;
  // @Output() someOutput = new EventEmitter<string>();
}
```

### Using a Directive (`upupaOnlyNumbers`)

Restrict an input field to only accept numbers.

```html
<label for="zip">Zip Code:</label>
<input type="text" id="zip" upupaOnlyNumbers>
```

### Using a Pipe (`markdown`)

Render markdown content as HTML.

```typescript
import { Component } from '@angular/core';
import { MarkdownPipe } from '@upupa/common';

@Component({
  selector: 'app-markdown-display',
  standalone: true,
  imports: [MarkdownPipe],
  template: `<div [innerHTML]="markdownContent | markdown"></div>`
})
export class MarkdownDisplayComponent {
  markdownContent = '`# Hello\n\nThis is **markdown** content.`';
}
```

### Using `EventBus`

Communicate between loosely coupled components.

```typescript
// service-a.ts
import { Injectable, inject } from '@angular/core';
import { EventBus } from '@upupa/common';

@Injectable({ providedIn: 'root' })
export class ServiceA {
  private bus = inject(EventBus);

  doSomething() {
    console.log('Service A: Doing something and publishing event.');
    this.bus.publish('data-updated', { payload: Math.random() });
  }
}

// component-b.ts
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { EventBus } from '@upupa/common';
import { Subscription } from 'rxjs';

@Component({ /* ... */ })
export class ComponentB implements OnInit, OnDestroy {
  private bus = inject(EventBus);
  private subscription: Subscription;

  ngOnInit() {
    this.subscription = this.bus.on('data-updated').subscribe(event => {
      console.log('Component B: Received data-updated event:', event.payload);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
