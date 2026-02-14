# @upupa Frontend Libraries

This directory contains a collection of Angular libraries (`@upupa/*`) designed to provide reusable UI components, services, and utilities for building frontend applications within this workspace.

## Overview

The `@upupa` libraries likely form the core of the frontend infrastructure, offering features such as:


## Key Libraries

Here's a brief overview of the likely purpose of each library based on its name:


```typescript
// Example: In your application's feature module (e.g., apps/crow-vista/crow-vista-ng/src/app/features/my-data/my-data.module.ts)
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpupaTableModule } from '@upupa/table'; // Assuming table has a module
import { MyDataTableComponent } from './my-data-table.component';

@NgModule({
  declarations: [MyDataTableComponent],
  imports: [
    CommonModule,
    UpupaTableModule // Import the module from the library
  ],
  exports: [MyDataTableComponent]
})
export class MyDataModule {}

// Example: In your component template (my-data-table.component.html)
// Assuming <upupa-table> is the selector for the table component
<upupa-table
  [data]="myData"
  [columns]="myColumns"
  (rowClick)="onRowClicked($event)">
</upupa-table>
```

**Important:** This is a conceptual example. The actual module names, component selectors, inputs, and outputs will vary for each library.

**Always refer to the specific `README.md` file within each `@upupa/*` library's directory for detailed installation (if any beyond workspace setup), configuration, API documentation, and concrete usage examples.**

## Frontend Error Contract

All frontend libraries should parse backend errors with a **code-first** strategy using `parseApiError` from `@upupa/common`.

- Source order: `error.error.code` → `error.body.code` → `error.code` → `msg` → `message`
- Code format: normalize to `UPPER_SNAKE_CASE`
- Fallback display: if no code, use `message`; if no message, use a generic error label

Use:

```typescript
import { parseApiError } from '@upupa/common';

const parsed = parseApiError(error);
const uiKey = parsed.code ?? parsed.message;
```
