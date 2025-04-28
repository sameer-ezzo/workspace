<!-- import these styles to your app -->
`@import "gridstack/dist/gridstack.min.css";`
`@import "gridstack/dist/gridstack-extra.min.css";`

# @upupa/widget

An Angular library for creating configurable, grid-based widget dashboards, powered by Gridstack.js.

## Features

*   **Widget Dashboard Builder (`WidgetBuilderComponent`):**
    *   Provides a dynamic grid layout using [Gridstack.js](https://gridstackjs.com/) (via `gridstack/dist/angular`).
    *   Allows users to add widgets from a predefined list (`WidgetBlueprint`).
    *   Supports drag-and-drop positioning and resizing of widgets.
    *   Enables removing and configuring widgets.
    *   Integrates with Angular Forms (`ControlValueAccessor`) to manage the layout state (an array of `Widget` configurations).
*   **Dynamic Widget Rendering:** Renders widget components dynamically using `@upupa/common/PortalComponent` based on configuration.
*   **Widget Configuration:**
    *   Define available widgets using `WidgetBlueprint` objects (specify component, default size, settings form, etc.).
    *   Configure individual widget instances using `WidgetSettingsComponent` (likely uses `@upupa/dynamic-form`).
*   **Extensible:** Add custom widget components and blueprints.
*   **Basic Widgets Included:** Provides simple widgets for Text, HTML, Markdown, and Images out-of-the-box.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `gridstack` and `gridstack/dist/angular` (core layout engine).
*   `@upupa/common` (for dynamic component loading).
*   `@upupa/dialog` (for widget selector/settings modals).
*   `@upupa/dynamic-form` (likely used for widget settings forms).
*   `@upupa/mat-btn` (used in dialogs).
*   Angular Material (`@angular/material`, `@angular/cdk`) installed and configured.

**Steps:**

1.  Install the library and its dependencies:

    ```bash
    npm install @upupa/widget gridstack gridstack/dist/angular @upupa/common @upupa/dialog @upupa/dynamic-form @upupa/mat-btn @angular/material @angular/cdk
    # or
    yarn add @upupa/widget gridstack gridstack/dist/angular @upupa/common @upupa/dialog @upupa/dynamic-form @upupa/mat-btn @angular/material @angular/cdk
    ```

2.  **Import Components/Modules:** Import the standalone `WidgetBuilderComponent` or other necessary components where needed. Ensure required Angular Material modules (Button, Icon, Dialog) are available.

    ```typescript
    import { WidgetBuilderComponent } from '@upupa/widget';
    import { ReactiveFormsModule } from '@angular/forms';
    import { MatButtonModule } from '@angular/material/button';
    import { MatIconModule } from '@angular/material/icon';
    // ... potentially MatDialogModule if not provided globally

    @Component({
      selector: 'app-dashboard',
      standalone: true,
      imports: [
        WidgetBuilderComponent,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule
        // ... other imports
      ],
      // ...
    })
    export class DashboardComponent { }
    ```

3.  **Include Gridstack CSS:** Import the Gridstack CSS file globally (e.g., in `angular.json` or `styles.scss`).

    ```json
    // angular.json
    "styles": [
      "node_modules/gridstack/dist/gridstack.min.css",
      // Optional theme:
      // "node_modules/gridstack/dist/gridstack-extra.min.css",
      "src/styles.scss"
    ]
    ```

## Usage

Use the `<widget-builder>` component, provide a list of available `WidgetBlueprint`s, and bind the layout data (array of `Widget` configurations) using `[(value)]` or form controls.

1.  **Define Widget Blueprints:** Create an array describing the widgets users can add.

    ```typescript
    import { WidgetBlueprint, TextWidgetComponent, HtmlWidgetComponent, MarkdownWidgetComponent } from '@upupa/widget';
    import { YourCustomWidgetComponent } from './your-custom-widget.component'; // Example custom widget

    const availableWidgets: WidgetBlueprint[] = [
      {
        id: 'text-widget',
        name: 'Text Block',
        description: 'Displays simple text content',
        template: { component: TextWidgetComponent },
        w: 4, h: 2 // Default dimensions
        // settingsForm: YourSettingsViewModel // Optional: ViewModel for settings
      },
      {
        id: 'html-widget',
        name: 'HTML Content',
        template: { component: HtmlWidgetComponent },
        w: 6, h: 3
      },
      {
        id: 'markdown-widget',
        name: 'Markdown',
        template: { component: MarkdownWidgetComponent },
        w: 6, h: 3
      },
      {
        id: 'custom-chart',
        name: 'Custom Chart',
        template: { component: YourCustomWidgetComponent },
        w: 6, h: 4
      }
      // ... add more blueprints
    ];
    ```

2.  **Use in Template:**

    ```html
    <h2>Dashboard Builder</h2>

    <widget-builder
        [blueprints]="widgetBlueprints"
        [(value)]="dashboardLayout"
        [gridOptions]="customGridOptions">
    </widget-builder>

    <!-- Display saved layout (for demonstration) -->
    <h3>Saved Layout:</h3>
    <pre>{{ dashboardLayout | json }}</pre>
    ```

    ```typescript
    import { Component, signal } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { WidgetBuilderComponent, Widget, WidgetBlueprint, TextWidgetComponent, HtmlWidgetComponent, MarkdownWidgetComponent } from '@upupa/widget';
    import { GridStackOptions } from 'gridstack';
    // Import Material modules if needed by child components or default templates
    import { MatButtonModule } from '@angular/material/button';
    import { MatIconModule } from '@angular/material/icon';
    // Your custom widgets
    // import { YourCustomWidgetComponent } from './your-custom-widget.component';

    @Component({
      selector: 'app-dashboard-example',
      standalone: true,
      imports: [
        CommonModule,
        WidgetBuilderComponent,
        // Import default/custom widget components if they are standalone
        TextWidgetComponent,
        HtmlWidgetComponent,
        MarkdownWidgetComponent,
        // YourCustomWidgetComponent,
        MatButtonModule,
        MatIconModule
      ],
      templateUrl: './dashboard-example.component.html' // Contains the HTML above
    })
    export class DashboardExampleComponent {

      // Define available widgets (as shown in step 1)
      widgetBlueprints: WidgetBlueprint[] = [
         { id: 'text-widget', name: 'Text Block', template: { component: TextWidgetComponent }, w: 4, h: 2 },
         { id: 'html-widget', name: 'HTML Content', template: { component: HtmlWidgetComponent }, w: 6, h: 3 },
         { id: 'markdown-widget', name: 'Markdown', template: { component: MarkdownWidgetComponent }, w: 6, h: 3 },
         // { id: 'custom-chart', name: 'Custom Chart', template: { component: YourCustomWidgetComponent }, w: 6, h: 4 }
      ];

      // Initial layout data (optional)
      initialLayout: Widget[] = [
        { id: 'w1', template: { selector: 'text-widget' }, x: 0, y: 0, w: 4, h: 2, inputs: { text: 'Initial Text Widget' } },
        { id: 'w2', template: { selector: 'html-widget' }, x: 4, y: 0, w: 6, h: 3, inputs: { html: '<p>Initial HTML</p>' } }
      ];

      // Use signal for layout data
      dashboardLayout = signal<Widget[]>(this.initialLayout);

      // Optional: Customize Gridstack options
      customGridOptions: GridStackOptions = {
        cellHeight: 100,
        margin: 10
      };

       constructor() {
         // Log changes to the layout
        // effect(() => {
        //   console.log('Dashboard Layout Updated:', this.dashboardLayout());
        // });
       }
    }
    ```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
