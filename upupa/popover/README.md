# @upupa/popover

An Angular library for creating flexible popover elements, built using Angular CDK.

## Features

*   **Declarative API:** Use directives (`popoverTriggerFor`, `popoverTargetAt`) to easily attach popovers to trigger elements.
*   **Flexible Positioning:** Control popover position relative to the trigger (above, below, before, after) with configurable offsets.
*   **Customizable Trigger Events:** Open popovers on click (default) or hover.
*   **Enter/Leave Delays:** Configure delays for hover-triggered popovers.
*   **Custom Content:** Display any template (`ng-template`) within the popover.
*   **Configurable Appearance:** Customize arrow size, offset, and color.
*   **Backdrop Control:** Option to close the popover when clicking the backdrop.
*   **Accessibility:** Built with accessibility in mind (uses CDK features).
*   **Animations:** Includes basic open/close animations.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later (Note: `package.json` lists v14, verify compatibility if needed).
*   Node.js (LTS version recommended).
*   `@angular/cdk` installed.
*   `@angular/animations` installed and `provideAnimations()` or `BrowserAnimationsModule` included in your application setup.

**Steps:**

1.  Install the library:

    ```bash
    npm install @upupa/popover @angular/cdk @angular/animations
    # or
    yarn add @upupa/popover @angular/cdk @angular/animations
    ```

2.  **Import Module/Standalone Directives:** Import `PopoverModule` or the standalone `PopoverTrigger`, `PopoverComponent`, and `PopoverTarget` where needed.

    ```typescript
    // Example in a feature component:
    import { PopoverTrigger, PopoverComponent } from '@upupa/popover';

    @Component({
      selector: 'app-my-feature',
      
      imports: [
        PopoverTrigger,    // Directive for the trigger element
        PopoverComponent,  // The popover panel itself
        // PopoverTarget might be needed if targeting a different element
      ],
      // ...
    })
    export class MyFeatureComponent { }
    ```

3.  **Provide Animations:** Ensure browser animations are enabled in your application config or root module.

    ```typescript
    // Example app.config.ts
    import { ApplicationConfig } from '@angular/core';
    import { provideAnimations } from '@angular/platform-browser/animations';

    export const appConfig: ApplicationConfig = {
      providers: [provideAnimations()]
    };
    ```

## Usage

1.  **Create the Popover Template:** Define the content of your popover within an `<upupa-popover>` component. Assign a template variable (e.g., `#myPopover`).
2.  **Attach the Trigger:** Add the `[popoverTriggerFor]` directive to the element that should open the popover, binding it to the popover's template variable.
3.  **Configure (Optional):** Use inputs like `popoverPositionX`, `popoverPositionY`, `popoverTriggerOn`, etc., on the trigger element to customize behavior.

```html
<!-- Button that triggers the popover on click -->
<button class="trigger"
        [popoverTriggerFor]="myPopover"
        popoverPositionX="after"
        popoverPositionY="below">
  Click Me
</button>

<!-- Button that triggers the popover on hover -->
<button class="trigger"
        [popoverTriggerFor]="hoverPopover"
        popoverTriggerOn="hover"
        [popoverEnterDelay]="300"
        [popoverLeaveDelay]="200">
  Hover Me
</button>

<!-- The Popover Panel Content -->
<upupa-popover #myPopover="upupaPopover">
  <ng-template>
    <div class="popover-content">
      <h4>Popover Title</h4>
      <p>This is the content of the popover!</p>
      <button (click)="myPopover.closePopover()">Close</button>
    </div>
  </ng-template>
</upupa-popover>

<upupa-popover #hoverPopover="upupaPopover">
  <ng-template>
    <div class="popover-content">
      <p>Appears on hover.</p>
    </div>
  </ng-template>
</upupa-popover>

```

```typescript
import { Component } from '@angular/core';
import { PopoverTrigger, PopoverComponent } from '@upupa/popover';
import { MatButtonModule } from '@angular/material/button'; // Example using material buttons

@Component({
  selector: 'app-popover-example',
  
  imports: [
    PopoverTrigger,
    PopoverComponent,
    MatButtonModule // Example
  ],
  templateUrl: './popover-example.component.html' // Contains the HTML above
})
export class PopoverExampleComponent { }
```

*(Note: You'll need to add appropriate styling for `.trigger` and `.popover-content`)*

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
