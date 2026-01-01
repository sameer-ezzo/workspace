# @upupa/tags

An Angular library for managing and displaying hierarchical tags or keywords.

## Features

*   **Hierarchical Tag Management (`TagsService`):**
    *   Provides methods for CRUD operations on tags (create, read, update, delete) via `@upupa/data`.
    *   Supports organizing tags in a hierarchy using parent paths/IDs.
    *   Methods to fetch tags by ID, path, name, or retrieve children of a specific path.
    *   Includes basic caching for fetched tags.
*   **UI Components:**
    *   `TagsChipsInputComponent`: An input component (likely based on Angular Material Chips) for selecting existing tags or adding new ones.
    *   `TagFormComponent`: A form component (likely using `@upupa/dynamic-form`) for creating or editing tag details (name, color, path, etc.).
    *   `TagsComponent`: (Likely) A component to display a list or cloud of tags.
*   **Tag Pipe (`TagsPipe`):** Provides formatting or filtering capabilities for tags within templates.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@upupa/data` installed and configured.
*   `@upupa/dynamic-form` (likely required for `TagFormComponent`).
*   `@upupa/common`.
*   Angular Material (`@angular/material`, `@angular/cdk`) installed and configured (especially `MatChipsModule`, `MatFormFieldModule`, `MatInputModule`, `MatIconModule`).

**Steps:**

1.  Install the library and its dependencies:

    ```bash
    npm install @upupa/tags @upupa/data @upupa/dynamic-form @upupa/common @angular/material @angular/cdk
    # or
    yarn add @upupa/tags @upupa/data @upupa/dynamic-form @upupa/common @angular/material @angular/cdk
    ```

2.  **Import Modules/Standalone Components:** Import `TagsModule` or individual standalone components like `TagsChipsInputComponent` where needed. Ensure necessary Angular Material modules are imported.

    ```typescript
    // Example in a feature component:
    import { TagsChipsInputComponent } from '@upupa/tags';
    import { ReactiveFormsModule } from '@angular/forms';
    import { MatChipsModule } from '@angular/material/chips';
    import { MatIconModule } from '@angular/material/icon';
    import { MatFormFieldModule } from '@angular/material/form-field';

    @Component({
      selector: 'app-my-feature',
      
      imports: [
        TagsChipsInputComponent,
        ReactiveFormsModule,
        // Required Material modules for TagsChipsInputComponent:
        MatChipsModule,
        MatIconModule,
        MatFormFieldModule
      ],
      // ...
    })
    export class MyFeatureComponent { }
    ```

3.  **Configure Backend:** Ensure your backend (configured via `@upupa/data`) has an endpoint (e.g., `/tag`) to handle CRUD operations for tags as expected by `TagsService`.

## Usage

### Using `TagsChipsInputComponent`

Integrate the chips input component into your Angular forms.

```html
<form [formGroup]="myForm">
  <mat-form-field appearance="fill">
    <mat-label>Keywords</mat-label>
    <tags-chips-input formControlName="keywords"
                      [parentPath]="'/categories/products'" <!-- Optional: Scope tags to a path -->
                      placeholder="Add keywords...">
    </tags-chips-input>
    <mat-hint>Enter keywords related to the item.</mat-hint>
  </mat-form-field>
</form>

<p>Selected Tags: {{ myForm.get('keywords')?.value | json }}</p>
```

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TagsChipsInputComponent, TagsService, Tag } from '@upupa/tags';
import { CommonModule } from '@angular/common';
// Required Material imports
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-tags-example',
  
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TagsChipsInputComponent,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule
  ],
  templateUrl: './tags-example.component.html' // Contains the HTML above
})
export class TagsExampleComponent implements OnInit {
  myForm: FormGroup;
  // Inject TagsService if you need to interact with tags programmatically
  private tagsService = inject(TagsService);

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    // Initialize with an array of Tag objects or IDs/names based on component behavior
    const initialTags: Partial<Tag>[] = [
      { _id: 'tech', name: 'Technology' },
      { _id: 'webdev', name: 'Web Development' }
    ];

    this.myForm = this.fb.group({
      keywords: [initialTags] // Bind to the form control
    });

    // Example: Fetching children tags
    // this.tagsService.getChildrenOf('/categories').subscribe(tags => console.log(tags));
  }
}
```

*(Note: The exact data format expected/emitted by `TagsChipsInputComponent` (e.g., array of Tag objects, array of strings, array of IDs) should be verified by inspecting the component's implementation.)*

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
