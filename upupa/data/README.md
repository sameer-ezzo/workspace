# @upupa/data

A library for abstracting data sources and managing data state in Angular applications, leveraging @ngrx/signals.

## Features

*   **Data Abstraction (`DataAdapter`):** Provides a unified interface (`DataAdapter`) to interact with different data sources (client-side arrays, server-side APIs).
*   **Multiple Data Source Types:**
    *   `ClientDataSource`: For working with in-memory JavaScript arrays.
    *   `ApiDataSource`: For interacting with backend RESTful APIs.
    *   `UrlDataSource`: (Likely for simple fetching from a specific URL).
*   **Reactive State Management:** Uses `@ngrx/signals` (`signalStore`) internally to manage data state (entities, loading, pagination, sorting, filtering, selection) reactively.
*   **Common Data Operations:** Supports loading (`load`), CRUD (`create`, `put`, `patch`, `delete`), pagination, sorting, filtering, and selection (`select`, `toggle`, `selectAll`, etc.).
*   **Data Normalization:** Automatically normalizes raw data into a consistent `NormalizedItem` structure with key, display, value, and image properties based on configuration.
*   **Easy Configuration:** Configure adapters using a `DataAdapterDescriptor` object specifying type, source details, key/display properties, and initial state.
*   **Helper Function:** `createDataAdapter` simplifies adapter instantiation.

## Installation

**Prerequisites:**

*   Angular v18.2.1 or later.
*   Node.js (LTS version recommended).
*   `@ngrx/signals` (required for the internal state management).
*   `@angular/common/http` (required for `ApiDataSource` and `UrlDataSource`).

**Steps:**

1.  Install the library and its peer dependencies:

    ```bash
    npm install @upupa/data @ngrx/signals
    # or
    yarn add @upupa/data @ngrx/signals
    ```

2.  **Provide HttpClient (if using API/URL sources):** Ensure `provideHttpClient()` is included in your application providers (e.g., `app.config.ts`).

## Quick Start

### Using `ClientDataAdapter` (Client-Side Array)

Manage data stored in a simple array within your component.

```typescript
import { Component, OnInit } from '@angular/core';
import { DataAdapter, ClientDataSource, DataAdapterDescriptor, createDataAdapter } from '@upupa/data';

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

@Component({
  selector: 'app-user-list-client',
  template: `
    <h3>Client-Side Users</h3>
    <div *ngIf="adapter.loading()">Loading...</div>
    <ul>
      <li *ngFor="let user of adapter.entities()">
        {{ user.display }} ({{ user.item.email }}) - Key: {{user.key}}
      </li>
    </ul>
    <p>Total: {{ adapter.page()?.length }}</p>
  `,
  // ... imports: [CommonModule]
})
export class UserListClientComponent implements OnInit {
  users: User[] = [
    { id: 1, name: 'Alice Smith', email: 'alice@example.com', active: true },
    { id: 2, name: 'Bob Johnson', email: 'bob@example.com', active: false },
  ];

  adapter: DataAdapter<User>;

  ngOnInit() {
    // Define how the adapter should work
    const descriptor: DataAdapterDescriptor<User> = {
      type: 'client', // Specify client-side data
      data: this.users,   // Provide the array
      keyProperty: 'id', // Property to use as the unique key
      displayProperty: 'name' // Property to use for display
    };

    // Create the adapter
    this.adapter = createDataAdapter(descriptor);
    // Initial load (optional for client-side if data is already present,
    // but good practice for consistency)
    this.adapter.load();
  }
}
```

### Using `ApiDataAdapter` (Server-Side API)

Interact with a backend API for data.

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { DataAdapter, ApiDataSource, DataAdapterDescriptor, createDataAdapter, FilterDescriptor, SortDescriptor, PageDescriptor } from '@upupa/data';
import { HttpClient } from '@angular/common/http'; // HttpClient is needed by ApiDataSource

interface Product {
  _id: string; // Example using MongoDB-style ID
  productName: string;
  category: string;
  price: number;
}

@Component({
  selector: 'app-product-list-server',
  template: `
    <h3>Server-Side Products</h3>
    <div *ngIf="adapter.loading()">Loading...</div>
    <!-- Add controls for sorting, filtering, pagination -->
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Category</th><th>Price</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let product of adapter.entities()">
          <td>{{ product.display }}</td>
          <td>{{ product.item.category }}</td>
          <td>{{ product.item.price | currency }}</td>
        </tr>
      </tbody>
    </table>
    <p>Total: {{ adapter.page()?.length }}</p>
    <!-- Add Paginator Component -->
  `,
 // ... imports: [CommonModule, CurrencyPipe]
})
export class ProductListServerComponent implements OnInit {
  // ApiDataSource needs HttpClient internally
  private http = inject(HttpClient);

  adapter: DataAdapter<Product>;

  ngOnInit() {
    const descriptor: DataAdapterDescriptor<Product> = {
      type: 'api',            // Specify API data source
      path: '/api/products', // Base path for your API endpoint
      keyProperty: '_id',    // Unique key property
      displayProperty: 'productName', // Display property
      page: { pageIndex: 0, pageSize: 10 }, // Initial pagination
      sort: { active: 'productName', direction: 'asc' }, // Initial sort
    };

    this.adapter = createDataAdapter(descriptor, this.http); // Pass HttpClient if needed by ApiDataSource
    this.adapter.load(); // Trigger initial data load from API
  }

  // Example methods to interact with the adapter
  applyFilter(filter: FilterDescriptor) {
    this.adapter.load({ filter: filter, page: { pageIndex: 0 } }); // Reset page on filter
  }

  applySort(sort: SortDescriptor) {
    this.adapter.load({ sort: sort });
  }

  changePage(page: PageDescriptor) {
    this.adapter.load({ page: page });
  }
}
```

## License

This library needs a `LICENSE` file. Please add one. (Assuming MIT if none provided).
