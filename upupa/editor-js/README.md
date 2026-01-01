# @upupa/editor-js

An Angular component library for integrating the block-style [Editor.js](https://editorjs.io/) editor.

## Features

*   **Editor.js Integration:** Provides an Angular component (`EditorJsInputComponent`) to easily embed and use the Editor.js editor.
*   **Block-Style Editing:** Leverages the clean, block-based editing experience of Editor.js.
*   **Configurable Tools:** Select which Editor.js tools (Header, List, Paragraph, Image, Quote, Delimiter, AI Text, etc.) are available to the user via component input.
*   **Angular Forms Compatible:** Implements `ControlValueAccessor` for seamless use with `ngModel` and Reactive Forms.
*   **Data Handling:** Works with the standard Editor.js `OutputData` JSON format.
*   **File Upload Support:** Includes built-in support for uploading images/files inserted into the editor (integrates with `@upupa/upload`).
*   **AI Text Tool:** Supports the `@alkhipce/editorjs-aitext` tool for AI-assisted content generation (requires separate configuration/API key).

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@upupa/common` (provides `InputBaseComponent`).
*   `@upupa/upload` (for file upload functionality).
*   `@upupa/auth` (used by the internal upload adapter).

**Steps:**

1.  Install the library and its **peer dependencies**:

    ```bash
    npm install @upupa/editor-js @upupa/common @upupa/upload @upupa/auth \
        @editorjs/editorjs \
        @editorjs/header @editorjs/list @editorjs/paragraph \
        @editorjs/quote @editorjs/delimiter @editorjs/warning \
        @alkhipce/editorjs-aitext
    # Add other @editorjs/* tool packages as needed

    # or using yarn:
    yarn add @upupa/editor-js @upupa/common @upupa/upload @upupa/auth \
        @editorjs/editorjs \
        @editorjs/header @editorjs/list @editorjs/paragraph \
        @editorjs/quote @editorjs/delimiter @editorjs/warning \
        @alkhipce/editorjs-aitext
    # Add other @editorjs/* tool packages as needed
    ```

2.  **Import the Component:** Import the standalone `EditorJsInputComponent` where needed.

    ```typescript
    import { EditorJsInputComponent } from '@upupa/editor-js';

    @Component({
      selector: 'app-my-page',
      
      imports: [ EditorJsInputComponent, ReactiveFormsModule /* or FormsModule */ ],
      // ...
    })
    export class MyPageComponent { }
    ```

## Usage

Use the `<editor-js-input>` component in your template. Bind the editor data using `ngModel` or `formControlName`.

```html
<form [formGroup]="myForm">

  <editor-js-input
      formControlName="editorContent"
      placeholder="Start writing your amazing content..."
      [tools]="availableTools"
      uploadPath="/api/uploads/editor-assets" <!-- Your backend endpoint for uploads -->
      [readOnly]="isReadOnly"
      label="Page Content">
  </editor-js-input>

  <!-- Display Saved Data (for demonstration) -->
  <pre>{{ myForm.get('editorContent')?.value | json }}</pre>

</form>
```

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EditorJsInputComponent } from '@upupa/editor-js';
import { OutputData } from '@editorjs/editorjs'; // Import type if needed
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-editor-example',
  
  imports: [CommonModule, ReactiveFormsModule, EditorJsInputComponent],
  templateUrl: './editor-example.component.html' // Contains the HTML above
})
export class EditorExampleComponent implements OnInit {
  myForm: FormGroup;
  isReadOnly = false;

  // Define which Editor.js tools to enable
  // Ensure corresponding packages are installed
  availableTools = [
    'Header',
    'Paragraph',
    'List',
    'Quote',
    'Delimiter',
    'Warning',
    'Image', // Assumes image upload support is configured
    'AIText' // Requires @alkhipce/editorjs-aitext and API key configuration
  ];

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    // Initial data for the editor (optional)
    const initialData: OutputData = {
      time: Date.now(),
      blocks: [
        { type: 'header', data: { text: 'Example Header', level: 2 } },
        { type: 'paragraph', data: { text: 'Start typing here...' } }
      ],
      version: "2.30.7" // Use the version of @editorjs/editorjs installed
    };

    this.myForm = this.fb.group({
      editorContent: [initialData] // Initialize with data or null
    });
  }
}
```

### Configuring AI Text Tool

To use the `AIText` tool (from `@alkhipce/editorjs-aitext`), you need to provide configuration, typically including an API key, via the `EDITOR_JS_AI_PROMPT` injection token.

```typescript
// Example provider in app.config.ts
import { EDITOR_JS_AI_PROMPT } from '@upupa/editor-js';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: EDITOR_JS_AI_PROMPT,
      useValue: { apiKey: 'YOUR_AI_SERVICE_API_KEY' /* other options */ }
    }
  ],
};
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
