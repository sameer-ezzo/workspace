# @upupa/html-editor

An Angular component library for integrating the CKEditor 5 WYSIWYG editor.

This library provides a component that wraps CKEditor 5 (specifically the decoupled document build by default) for easy integration into Angular applications.

## Features

*   **CKEditor 5 Integration:** Provides an Angular component (`HtmlEditorComponent`) to embed the CKEditor 5 rich text editor.
*   **Rich Text Editing:** Leverages the powerful WYSIWYG editing features of CKEditor 5.
*   **Configurable:** Allows passing CKEditor 5 configuration options through component inputs.
*   **Angular Forms Compatible:** Implements `ControlValueAccessor` for seamless use with `ngModel` and Reactive Forms.
*   **File Upload Support:** Includes built-in support for uploading images/files inserted into the editor (integrates with `@upupa/upload`).
*   **Decoupled Build:** Uses the decoupled document build, allowing separate placement/styling of the toolbar and editing area (handled internally by the component).

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@upupa/common` (provides `InputBaseComponent`).
*   `@upupa/upload` (for file upload functionality).
*   `@upupa/auth` (used by the internal upload adapter).

**Steps:**

1.  Install the library and its **peer dependencies** (including a CKEditor 5 build):

    ```bash
    npm install @upupa/html-editor @upupa/common @upupa/upload @upupa/auth \
        @ckeditor/ckeditor5-build-decoupled-document \
        @ckeditor/ckeditor5-core @ckeditor/ckeditor5-engine \
        @ckeditor/ckeditor5-utils @ckeditor/ckeditor5-watchdog
    # or use a different build like @ckeditor/ckeditor5-build-classic

    # or using yarn:
    yarn add @upupa/html-editor @upupa/common @upupa/upload @upupa/auth \
        @ckeditor/ckeditor5-build-decoupled-document \
        @ckeditor/ckeditor5-core @ckeditor/ckeditor5-engine \
        @ckeditor/ckeditor5-utils @ckeditor/ckeditor5-watchdog
    # or use a different build like @ckeditor/ckeditor5-build-classic
    ```
    *(Note: You only need **one** CKEditor 5 build, e.g., `-build-decoupled-document` OR `-build-classic`. The other `@ckeditor` packages are usually required core dependencies.)*

2.  **Import the Component:** Import the standalone `HtmlEditorComponent` where needed.

    ```typescript
    import { HtmlEditorComponent } from '@upupa/html-editor';

    @Component({
      selector: 'app-my-page',
      standalone: true,
      imports: [ HtmlEditorComponent, ReactiveFormsModule /* or FormsModule */ ],
      // ...
    })
    export class MyPageComponent { }
    ```

3.  **CSS Imports (Important):** CKEditor 5 requires its CSS to be loaded globally. Add the CKEditor 5 theme and potentially structural CSS to your application's global styles (e.g., `styles.scss` or `angular.json`).

    ```scss
    // Example in styles.scss
    @import "@ckeditor/ckeditor5-build-decoupled-document/build/ckeditor.css";
    // Or the path for the specific build you installed
    ```
    *Refer to the [CKEditor 5 Angular integration guide](https://ckeditor.com/docs/ckeditor5/latest/installation/integrations/angular.html) for detailed styling instructions.*)

## Usage

Use the `<form-html>` component in your template. Bind the editor content (HTML string) using `ngModel` or `formControlName`.

```html
<form [formGroup]="myForm">

  <form-html
      formControlName="pageContent"
      placeholder="Start typing your content here..."
      uploadPath="/api/uploads/editor-assets" <!-- Your backend endpoint for uploads -->
      [readonly]="isReadOnly"
      label="Page Content">
  </form-html>

  <!-- Display Saved Data (for demonstration) -->
  <h3>Generated HTML:</h3>
  <pre>{{ myForm.get('pageContent')?.value }}</pre>

</form>
```

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HtmlEditorComponent } from '@upupa/html-editor';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-html-editor-example',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HtmlEditorComponent],
  templateUrl: './html-editor-example.component.html' // Contains the HTML above
})
export class HtmlEditorExampleComponent implements OnInit {
  myForm: FormGroup;
  isReadOnly = false;

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    // Initial HTML content for the editor (optional)
    const initialContent = '<p>Hello, <strong>world</strong>!</p>';

    this.myForm = this.fb.group({
      pageContent: [initialContent] // Initialize with HTML string or null
    });
  }
}
```

### Custom Configuration

You can pass CKEditor 5 configuration options via the `editorConfig` input.

```html
<form-html
    formControlName="pageContent"
    [editorConfig]="customConfig">
</form-html>
```

```typescript
import { Component } from '@angular/core';
// Import necessary types from CKEditor 5 if needed for config
// import { EditorConfig } from '@ckeditor/ckeditor5-core';

@Component({ /* ... */ })
export class MyEditorComponent {
  customConfig = {
    // Example: Customize the toolbar (syntax depends on the build used)
    // toolbar: [ 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote' ],
    placeholder: 'Type the content here!',
    // See CKEditor 5 documentation for available configuration options
  };
  // ...
}
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
