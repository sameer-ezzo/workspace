# @upupa/table

A dynamic and configurable table component library for Angular, leveraging decorators for easy column definition.

## Features

*   **Decorator-Based Configuration:** Define table columns, headers, pipes, templates, and behavior using the `@column` decorator on a ViewModel class.
*   **Data Agnostic:** Integrates with `@upupa/data` adapters to work with various data sources (client-side arrays, server-side APIs).
*   **Custom Cell Templates:** Render complex content or interactive elements within cells using Angular components.
*   **Pipes:** Apply built-in or custom Angular pipes for data formatting.
*   **Sorting & Pagination:** Built-in support using Angular Material components.
*   **Row Selection:** Single and multiple row selection capabilities.
*   **Sticky Columns:** Pin columns to the start or end of the table.
*   **Expandable Rows:** Configure rows to expand and show detailed information or secondary data.
*   **Column Visibility Control:** Users can potentially show/hide columns (requires `ColumnsSelectComponent`).

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   Peer dependencies required by `@angular/material` components used internally (like `MatTableModule`, `MatPaginatorModule`, `MatSortModule`, `MatCheckboxModule`). Install `@angular/material` and `@angular/cdk` if you haven't already.
*   `@upupa/data` for data handling.

**Steps:**

1.  Install the library and its peer dependencies:

    ```bash
    npm install @upupa/table @upupa/data @angular/material @angular/cdk
    # or
    yarn add @upupa/table @upupa/data @angular/material @angular/cdk
    ```

2.  **Import necessary modules:** Ensure you import `DataTableModule` (or the standalone `DataTableComponent`) into your feature module or component. You might also need `MatSortModule` and `MatPaginatorModule` if you intend to use sorting and pagination features directly in your template (though `DataTableComponent` often handles them internally).

    ```typescript
    // Example in a standalone component:
    import { DataTableComponent } from '@upupa/table';

    @Component({
      // ...
      
      imports: [ DataTableComponent, /* other necessary imports */ ],
      // ...
    })
    export class MyFeatureComponent { }
    ```

## Quick Start

1.  **Define a Table ViewModel Class:** Create a class representing your data structure and use the `@column` decorator to define which properties should appear as columns.

    ```typescript
    import { Component, Type } from '@angular/core';
    import { column } from '@upupa/table';
    import { DatePipe } from '@angular/common';

    export class UserViewModel {
      @column({ header: 'User ID', sticky: 'start' }) // Basic column with sticky positioning
      id: number;

      @column({ header: 'Full Name' }) // Header inferred as 'Full Name' if not provided
      name: string;

      @column() // Header inferred as 'Email'
      email: string;

      @column({ header: 'Registration Date', pipe: { pipe: DatePipe, args: ['mediumDate'] } }) // Using DatePipe
      registeredOn: Date;

      @column({ header: 'Active', template: /* Custom component/template needed */ }) // Requires a template for boolean
      isActive: boolean;
    }
    ```

2.  **Use the `data-table` Component:** Add the `<data-table>` component to your template. Provide the data source via the `adapter` input (using `@upupa/data` adapters) and the ViewModel class via the `columns` input (or let it infer from data).

    ```typescript
    import { Component } from '@angular/core';
    import { DataTableComponent } from '@upupa/table';
    import { ClientDataAdapter } from '@upupa/data'; // Example using ClientDataAdapter
    import { UserViewModel } from './user.viewmodel'; // Import the ViewModel

    @Component({
      selector: 'app-user-list',
      
      imports: [ DataTableComponent ],
      template: `
        <h2>User List</h2>
        <data-table
          [adapter]="dataAdapter"
          [columnsDefinition]="UserViewModel"
          [multiSelect]="true"
          [showPaginator]="true"
          [pageSizeOptions]="[5, 10, 20]"
          (selectionChange)="onSelectionChange($event)">
        </data-table>
      `
    })
    export class UserListComponent {
      UserViewModel = UserViewModel; // Make the type available

      // Example data
      users = [
        { id: 1, name: 'Alice', email: 'alice@example.com', registeredOn: new Date(), isActive: true },
        { id: 2, name: 'Bob', email: 'bob@example.com', registeredOn: new Date(Date.now() - 86400000), isActive: false },
        { id: 3, name: 'Charlie', email: 'charlie@example.com', registeredOn: new Date(Date.now() - 172800000), isActive: true }
      ];

      // Use @upupa/data adapter
      dataAdapter = new ClientDataAdapter<UserViewModel>({ data: this.users });

      onSelectionChange(selectedUsers: any[]) {
        console.log('Selected:', selectedUsers);
      }
    }
    ```

## More Examples / Common Tasks

### 1. Custom Cell Template Component

Provide a component to render custom content in a cell.

**a. Create a Template Component:**

```typescript
import { Component, inject } from '@angular/core';
import { injectRowItem } from '@upupa/table'; // Helper to inject current row data
import { UserViewModel } from '../user.viewmodel'; // Your data model

@Component({
  selector: 'app-user-status-template',
  
  template: `
    <span [style.color]="user.isActive ? 'green' : 'red'">
      {{ user.isActive ? 'Active' : 'Inactive' }}
    </span>
  `
})
export class UserStatusTemplateComponent {
  // Inject the data item for the current row
  readonly user = injectRowItem<UserViewModel>();
}
```

**b. Use the template in `@column`:**

```typescript
import { UserStatusTemplateComponent } from './templates/user-status-template.component';

export class UserViewModel {
  // ... other columns
  @column({ header: 'Active', template: UserStatusTemplateComponent })
  isActive: boolean;
}
```

### 2. Using Pipes

Apply pipes for formatting.

```typescript
import { DatePipe, CurrencyPipe } from '@angular/common';

export class ProductViewModel {
  @column()
  name: string;

  @column({ pipe: { pipe: CurrencyPipe, args: ['USD', 'symbol', '1.2-2'] } })
  price: number;

  @column({ pipe: { pipe: DatePipe, args: ['yyyy-MM-dd'] } })
  addedDate: Date;
}
```

### 3. Sticky Columns

Pin important columns to the start or end.

```typescript
export class TaskViewModel {
  @column({ header: 'Actions', sticky: 'start', template: /* ActionButtonsComponent */ })
  id: string; // Often use ID column for actions

  @column()
  description: string;

  @column()
  priority: 'Low' | 'Medium' | 'High';

  @column({ header: 'Due Date', pipe: { pipe: DatePipe, args: ['shortDate'] }, sticky: 'end' })
  dueDate: Date;
}
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
