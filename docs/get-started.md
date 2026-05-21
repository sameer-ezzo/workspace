# Getting Started with NX monorepo

## Create new NX workspace

### Step 1: Initialize the workspace
Run the following command and follow the prompts:

```bash
pnpx create-nx-workspace
```

For more details, visit: https://nx.dev/nx-api/nx/documents/create-nx-workspace

**Example output:**
```bash
➜ pnpx create-nx-workspace
    Packages: +70
    ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Progress: resolved 70, reused 69, downloaded 1, added 70, done

     NX   Let's create a new workspace [https://nx.dev/getting-started/intro]

    ✔ Where would you like to create your workspace? · iepo
    ✔ Which stack do you want to use? · angular
    ✔ Integrated monorepo, or standalone project? · integrated
    ✔ Application name · web-ui
    ✔ Which bundler would you like to use? · esbuild
    ✔ Default stylesheet format · scss
    ✔ Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)? · Yes
    ✔ Would you like to use the Server Routing and App Engine APIs (Developer Preview) for this server application? · Yes
    ✔ Which unit test runner would you like to use? · jest
    ✔ Test runner to use for end to end (E2E) tests · playwright
    ✔ Which CI provider would you like to use? · skip
    ✔ Would you like remote caching to make your build faster? · skip
```

### Step 2: Navigate and create libraries directory
```bash
cd iepo
mkdir libs
```

### Step 3: Add workspace as a git submodule
```bash
git submodule add https://github.com/sameer-ezzo/workspace.git libs/workspace
```

### Step 4: Configure TypeScript paths
Add the following to your `tsconfig.base.json` under the `paths` section:

```json
"paths": {
    // Insert these below your app paths
    "@noah-ark/common": ["libs/workspace/noah-ark/common/src/index.ts"],
    "@noah-ark/event-bus": ["libs/workspace/noah-ark/event-bus/src/index.ts"],
    "@noah-ark/expression-engine": ["libs/workspace/noah-ark/expression-engine/src/index.ts"],
    "@noah-ark/json-patch": ["libs/workspace/noah-ark/json-patch/src/index.ts"],
    "@noah-ark/path-matcher": ["libs/workspace/noah-ark/path-matcher/src/index.ts"],
    "@ss/api": ["libs/workspace/ss/ss-api/src/index.ts"],
    "@ss/auth": ["libs/workspace/ss/ss-auth/src/index.ts"],
    "@ss/common": ["libs/workspace/ss/ss-common/src/index.ts"],
    "@ss/data": ["libs/workspace/ss/ss-data/src/index.ts"],
    "@ss/notifications": ["libs/workspace/ss/ss-notifications/src/index.ts"],
    "@ss/payment": ["libs/workspace/ss/ss-payment/src/index.ts"],
    "@ss/rules": ["libs/workspace/ss/ss-rules/src/index.ts"],
    "@ss/storage": ["libs/workspace/ss/ss-storage/src/index.ts"],
    "@ss/users": ["libs/workspace/ss/ss-users/src/index.ts"],
    "@upupa/auth": ["libs/workspace/upupa/auth/src/index.ts"],
    "@upupa/authz": ["libs/workspace/upupa/authz/src/index.ts"],
    "@upupa/common": ["libs/workspace/upupa/common/src/index.ts"],
    "@upupa/cp": ["libs/workspace/upupa/cp/src/index.ts"],
    "@upupa/data": ["libs/workspace/upupa/data/src/index.ts"],
    "@upupa/dialog": ["libs/workspace/upupa/dialog/src/index.ts"],
    "@upupa/dynamic-form": ["libs/workspace/upupa/dynamic-form/src/index.ts"],
    "@upupa/dynamic-form-material-theme": ["libs/workspace/upupa/dynamic-form-material-theme/src/index.ts"],
    "@upupa/html-editor": ["libs/workspace/upupa/html-editor/src/index.ts"],
    "@upupa/language": ["libs/workspace/upupa/language/src/index.ts"],
    "@upupa/mat-btn": ["libs/workspace/upupa/mat-btn/src/index.ts"],
    "@upupa/membership": ["libs/workspace/upupa/membership/src/index.ts"],
    "@upupa/payment": ["libs/workspace/upupa/payment/src/index.ts"],
    "@upupa/permissions": ["libs/workspace/upupa/permissions/src/index.ts"],
    "@upupa/popover": ["libs/workspace/upupa/popover/src/index.ts"],
    "@upupa/table": ["libs/workspace/upupa/table/src/index.ts"],
    "@upupa/tags": ["libs/workspace/upupa/tags/src/index.ts"],
    "@upupa/upload": ["libs/workspace/upupa/upload/src/index.ts"],
    "socket.io": ["libs/workspace/node_modules/socket.io/lib/index.js"]
}
```

Then add the following to your `nx.json` under the `targetDefaults` section:

```json
"targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    },
    ...
}
```


## Configuration Guide

### Server-side Integration
1. Add NestJs dependency:
```bash
pnpm add @nx/nest
```
2. Run the following command to initialize the NestJs application:
```bash
pnpm exec nx g @nx/nest:init --interactive=false
```
3. Create a new NestJs application:

```bash
nx g @nx/nest:application --directory=apps/your-ss-app-name --linter=eslint --name=your-ss-app-name
```
4. Add the following dependencies:
```bash
pnpm add @nestjs/config @nestjs/event-emitter @nestjs/schedule @nestjs/websockets @nestjs/microservices express-handlebars @nestjs/platform-socket.io socket.io google-auth-library @nestjs/passport @nestjs/mongoose mongoose mongodb mongoose-unique-validator jsonpatch-to-mongodb jose @socket.io/redis-adapter socket.io-redis socket.io-client ioredis busboy object-to-csv bcryptjs passport-facebook passport-google-oauth20 sharp
 
pnpm add -D @types/express-handlebars @types/jest
```

#### Configuring Server-side app to use @ss modules
  In you Server side app tsconfig use: `strict:false`

#### Configuring Server-side app for Debugging
modify the `webpack.config.js` file in the `apps/your-ss-app-name` directory to include the following:

```javascript
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, relative } = require('path');
const WORKSPACE_ROOT =
  process.env.NX_WORKSPACE_ROOT ?? join(__dirname, '..', '..');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/your-ss-app-name'),
    devtoolModuleFilenameTemplate: function (info) {
      let resourcePath = info.resourcePath;
      if (resourcePath.startsWith('.')) {
        const rel = relative(WORKSPACE_ROOT, info.absoluteResourcePath);
        resourcePath = `./${rel}`;
      }

      const segments = [resourcePath, info.loaders].filter((x) => x);
      return `webpack:///${segments.join('?')}`;
    },
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      sourceMap: true,
      generatePackageJson: true,
    }),
  ],
};
```

#### Server-side Testing configuration
*Documentation coming soon*

### Client-side Integration

#### Step 1: TypeScript Configuration

In your Angular app's `tsconfig.json`, add the following compiler options required by the upupa decorator system:

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "types": ["@angular/localize"]
  }
}
```

> **Why these settings?**
> - `emitDecoratorMetadata` + `experimentalDecorators`: required for `@FormViewModel`, `@formInput`, and `@column` decorators to reflect type metadata at runtime.
> - `useDefineForClassFields: false`: prevents Angular's class field initialization from overwriting decorator-applied metadata.
> - `types: ["@angular/localize"]`: the membership lib uses `$localize` template tags; this provides the global type.

In your app's `tsconfig.app.json`, also add:

```json
{
  "compilerOptions": {
    "types": ["@angular/localize"]
  }
}
```

Do **not** set `isolatedModules: true` together with `emitDecoratorMetadata: true` — they are incompatible and will cause TS1272 errors.

#### Step 2: Install Required Packages

```bash
pnpm add @angular/localize mongodb
```

- `@angular/localize` is required at runtime (membership lib uses `$localize`).
- `mongodb` types are needed transitively by `@noah-ark/common`.

Add `@angular/localize/init` to the `polyfills` array in your `project.json`:

```json
{
  "options": {
    "polyfills": ["zone.js", "@angular/localize/init"]
  }
}
```

Also add `"dependsOn": []` to your app's build target to skip attempting to build the workspace libs (they are consumed via TypeScript path aliases, not pre-built):

```json
{
  "targets": {
    "build": {
      "dependsOn": []
    }
  }
}
```

---

## @upupa Library Reference

Each library below is a standalone Angular feature library. All are consumed via TypeScript path aliases — no npm publishing or pre-build step needed.

---

### `@upupa/data` — HTTP Data Layer

**Purpose:** Provides a unified data service and API adapter that wraps `HttpClient` with pagination, filtering, and CRUD support.

**Setup (`app.config.ts`):**

```typescript
import { provideApi } from '@upupa/data';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideApi('/api'),  // base URL for all data requests
  ]
};
```

**`provideApi(url)`** — registers the `APIBASE` token. All `DataService` calls are relative to this URL.

**Key services:**

```typescript
import { DataService } from '@upupa/data';

// In a component or service:
const ds = inject(DataService);

// GET /api/products?page=1&per_page=20
ds.get<Product>('/products', { page: 1, per_page: 20 });

// GET /api/products/123
ds.get<Product>('/products/123');

// POST /api/products
ds.post<Product>('/products', { name: 'Test' });

// PUT /api/products/123
ds.put<Product>('/products/123', { name: 'Updated' });

// DELETE /api/products/123
ds.delete('/products/123');
```

**Data Adapter (for table/form integration):**

```typescript
import { DataAdapterDescriptor } from '@upupa/data';

const adapter: DataAdapterDescriptor = {
  type: 'api',
  path: '/products',       // relative to APIBASE
  keyProperty: '_id',      // primary key field name
};
```

The API endpoint must support:
- `GET /path?page=N&per_page=N&search=...` → `{ data: T[], total: number }` with `X-Total-Count` header
- `GET /path/:id`, `POST /path`, `PUT /path/:id`, `DELETE /path/:id`

---

### `@upupa/auth` — Authentication

**Purpose:** JWT-based authentication with support for multiple identity providers (email/password, Google, etc.).

**Setup (`app.config.ts`):**

```typescript
import { provideAuth, withEmailAndPassword, AuthInterceptor } from '@upupa/auth';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([AuthInterceptor])),
    provideAuth(
      { base_url: '/auth' },   // AuthOptions — base URL of the auth server
      withEmailAndPassword(),   // enable email/password IDP
    ),
  ]
};
```

**`provideAuth(options, ...features)`**
- `options`: `Partial<AuthOptions>` — `{ base_url: string, passwordPolicy?, useCookies? }`
- `features`: one or more IDP feature arrays, e.g. `withEmailAndPassword()`

**`AuthInterceptor`** — automatically attaches `Authorization: Bearer <token>` to every HTTP request.

**Protecting routes:**

```typescript
import { AuthGuard } from '@upupa/auth';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  }
];
```

**Reading the current user:**

```typescript
import { AuthUserAccessor } from '@upupa/auth';

const auth = inject(AuthUserAccessor);

auth.user          // current user snapshot (synchronous)
auth.user$         // observable stream of user changes
auth.hasRole('admin')  // role check
```

---

### `@upupa/cp` — Control Panel Layout

**Purpose:** Provides the full admin shell: sidebar navigation, topbar, layout component, and the `provideLayoutRoute` routing primitive.

**Setup (`app.config.ts`):**

```typescript
import { provideControlPanel } from '@upupa/cp';

export const appConfig: ApplicationConfig = {
  providers: [
    provideControlPanel(),
  ]
};
```

**`provideLayoutRoute(config)`** — wraps a route with `CpLayoutComponent`, sidebar injection, and login redirect:

```typescript
import { provideLayoutRoute, routesToActions } from '@upupa/cp';

export const backendRoutes: Routes = [
  provideRoute(
    { path: 'dashboard', component: DashboardComponent },
    withAction({ action: 'Read:/dashboard', icon: 'dashboard', text: 'Dashboard' }),
  ),
  ...featureRoutes,
];

export const appRoutes: Routes = [
  provideRoute({ path: 'login', loadComponent: () => import('@upupa/membership').then(m => m.LoginComponent) }),
  provideLayoutRoute({
    path: '',
    loginUrl: '/login',
    logo: '/assets/logo.png',       // optional — shown in sidebar header
    sidebar: { useFactory: () => routesToActions(backendRoutes) },
    children: backendRoutes,
  }),
];
```

**`routesToActions(routes, basePath?)`** — reads `withAction()` metadata from routes and builds the sidebar `SideBarViewModel` automatically. Any route decorated with `withAction` appears in the sidebar.

**`withAction(descriptor)`** — attaches sidebar metadata to a route. `action` is required:

```typescript
import { withAction } from '@upupa/common';

withAction({
  action: 'Read:/threats',    // required — used for RBAC checks
  icon: 'warning',            // Material Symbol icon name
  text: 'Threats',            // sidebar label
  group: {                    // optional — groups items under a collapsible header
    name: 'Security',
    icon: 'security',
    text: 'Security',
    expanded: true,
  },
})
```

**Layout config options:**

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string` | Route path (usually `''`) |
| `loginUrl` | `string` | Redirect here if not authenticated |
| `logo` | `string \| null` | URL shown in sidebar header |
| `sidebar` | `SideBarViewModel \| { useFactory }` | Sidebar items array or factory |
| `topbar` | `(DynamicComponent \| 'spacer')[]` | Topbar components |
| `children` | `Routes` | Child routes rendered inside the layout |

---

### `@upupa/table` — Data Table

**Purpose:** Decorator-based data table with sorting, pagination, search, and custom cell templates.

**Setup (`app.config.ts`):**

```typescript
import { provideDataTable } from '@upupa/table';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDataTable(),
  ]
};
```

**Defining a table viewmodel:**

```typescript
import { column } from '@upupa/table';
import { editButton, deleteButton } from '@upupa/cp';
import { injectDataAdapter } from '@upupa/table';

export class ProductTable {
  @column({ header: 'Name', order: 1 })
  name = '';

  @column({ header: 'Price', order: 2 })
  price = 0;

  @column({ header: 'Category', order: 3 })
  category = '';

  @column({
    header: ' ',
    class: 'actions',
    template: [
      editButton(ProductForm, (btn) => btn.item()),
      deleteButton((btn) => injectDataAdapter().delete(btn.item(), { refresh: true })),
    ],
  })
  actions: any;
}
```

**`@column(options)`** decorator options:

| Option | Type | Description |
|--------|------|-------------|
| `header` | `string` | Column header label (defaults to camelCase → Title Case) |
| `order` | `number` | Display order |
| `template` | `Type \| DynamicComponent \| array` | Custom cell component(s) |
| `displayPath` | `string` | JSON pointer path to display value (defaults to property name) |
| `pipe` | `{ pipe, args }` | Angular pipe to apply (auto-detected for `Date` properties) |
| `class` | `string` | CSS class on the column |
| `visible` | `boolean` | Whether column is shown by default |

**Custom cell templates** implement `ITableCellTemplate`:

```typescript
import { Component, input } from '@angular/core';
import { ITableCellTemplate } from '@upupa/table';

@Component({
  standalone: true,
  template: `<span class="badge {{ value() }}">{{ value() }}</span>`,
})
export class StatusBadgeComponent implements ITableCellTemplate<string> {
  value = input<string>();
}
```

**Registering a table as a route:**

```typescript
import { provideTableRoute, withHeader } from '@upupa/table';
import { createButton } from '@upupa/cp';
import { withAction } from '@upupa/common';

export const productRoutes: Routes = [
  provideTableRoute(
    {
      path: 'products',
      viewModel: ProductTable,
      dataAdapter: { type: 'api', path: '/products', keyProperty: '_id' } as any,
      tableHeaderComponent: withHeader(true, createButton(ProductForm)),
    },
    withAction({ action: 'Read:/products', icon: 'inventory', text: 'Products' }),
  ),
];
```

**`provideTableRoute(config, ...features)`**
- `config.viewModel` — table viewmodel class
- `config.dataAdapter` — `DataAdapterDescriptor` or `DataAdapter` instance
- `config.tableHeaderComponent` — header component (use `withHeader(showSearch, ...buttons)`)
- `config.expandable` — `'single' | 'multi' | 'none'`

**`withHeader(showSearch, ...components)`** — creates a table header bar with an optional search field and action buttons.

**`injectDataAdapter()`** — injects the current route's data adapter inside injection context (use inside column template callbacks):

```typescript
deleteButton((btn) => injectDataAdapter().delete(btn.item(), { refresh: true }))
```

---

### `@upupa/dynamic-form` — Dynamic Forms

**Purpose:** Decorator-based form generation from plain TypeScript classes. Renders forms via themes (Material, native).

**Setup (`app.config.ts`):**

```typescript
import { provideDynamicForm } from '@upupa/dynamic-form';
import { DF_MATERIAL_THEME_INPUTS } from '@upupa/dynamic-form-material-theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDynamicForm(
      [],                                    // extra providers
      { material: DF_MATERIAL_THEME_INPUTS as any },  // theme map
      'material',                            // default theme name
    ),
  ]
};
```

**Defining a form viewmodel:**

```typescript
import { FormViewModel, formInput } from '@upupa/cp'; // re-exports from @upupa/dynamic-form
import { adapterSubmit } from '@upupa/cp';

@FormViewModel()
export class ProductForm {
  @formInput({ input: 'text', label: 'Product Name', required: true })
  name = '';

  @formInput({ input: 'number', label: 'Price', required: true })
  price = 0;

  @formInput({
    input: 'select',
    label: 'Category',
    required: true,
    adapter: {
      type: 'client',
      data: [
        { _id: 'electronics', name: 'Electronics' },
        { _id: 'clothing', name: 'Clothing' },
      ],
    },
  })
  category = '';

  @formInput({ input: 'textarea', label: 'Description', rows: 4 })
  description = '';

  async onSubmit() {
    return adapterSubmit(this);
  }
}
```

**`@FormViewModel(attributes?)`** — marks the class as a form definition. Internally calls `@formScheme()`.

**`@formInput(options)`** decorator options:

| Option | Type | Description |
|--------|------|-------------|
| `input` | `string` | Input type: `'text'`, `'number'`, `'select'`, `'textarea'`, `'switch'`, `'date'`, `'password'`, `'radio'`, `'file'` |
| `label` | `string` | Field label |
| `required` | `boolean` | Marks field as required |
| `placeholder` | `string` | Placeholder text |
| `hint` | `string` | Help text shown below the field |
| `disabled` | `boolean` | Disables the field |
| `readonly` | `boolean` | Renders as read-only |
| `adapter` | `DataAdapterDescriptor` | For `select`, `radio`, `autocomplete` — provides the list of options |
| `validations` | `Validator[]` | Additional validators |
| `appearance` | `'fill' \| 'outline'` | Material form field appearance |

**`adapterSubmit(viewModelInstance)`** — called from `onSubmit()`. Reads the form's data adapter from the DI context and calls `create` or `update` depending on whether the current item has an `_id`. Shows a success/error snackbar automatically.

**Standalone form route:**

```typescript
import { provideFormRoute } from '@upupa/dynamic-form';

provideFormRoute({
  path: 'products/new',
  viewModel: ProductForm,
  value: () => new ProductForm(),
});
```

**Available input types (Material theme):**

| `input` value | Component | Notes |
|--------------|-----------|-------|
| `text` | `InputComponent` | Single-line text |
| `number` | `NumberComponent` | Numeric input |
| `password` | `PasswordComponent` | Password with toggle |
| `textarea` | `TextAreaComponent` | Multi-line text |
| `select` | `SelectComponent` | Dropdown — requires `adapter` |
| `radio` | `ChoicesComponent` | Radio group — requires `adapter` |
| `switch` | `SwitchComponent` | Toggle/checkbox |
| `date` | `DateInputComponent` | Date picker |
| `file` | `FileInputComponent` | File upload |
| `color` | `ColorInputComponent` | Color picker |
| `phone` | `PhoneComponent` | Phone with country code |
| `slider` | `SliderComponent` | Range slider |

---

### `@upupa/cp` — Form Dialog Buttons

**Purpose:** Pre-built action buttons that open form dialogs for create/edit/delete.

**`createButton(formVM, valueFn?, options?)`** — opens a dialog with the form in create mode:

```typescript
import { createButton } from '@upupa/cp';

// Used in table header:
withHeader(true, createButton(ProductForm))

// With custom dialog title:
createButton(ProductForm, () => new ProductForm(), {
  dialogOptions: { title: 'Add New Product' },
})
```

**`editButton(formVM, valueFn?, options?)`** — opens a dialog with the current row's data pre-loaded:

```typescript
import { editButton } from '@upupa/cp';

// In column template — passes current row item to dialog:
editButton(ProductForm, (btn) => btn.item())
```

**`deleteButton(deleteFn?, options?)`** — shows a confirmation dialog then deletes:

```typescript
import { deleteButton } from '@upupa/cp';
import { injectDataAdapter } from '@upupa/table';

// Default — uses data adapter from DI:
deleteButton()

// Custom delete logic:
deleteButton((btn) => injectDataAdapter().delete(btn.item(), { refresh: true }))

// With custom confirmation text:
deleteButton(undefined, {
  confirm: {
    title: 'Remove Product',
    confirmText: 'This cannot be undone.',
    yes: 'Delete',
    no: 'Cancel',
  }
})
```

---

### `@upupa/membership` — Login & User Management

**Purpose:** Ready-made login, signup, forgot-password, and user management UI components.

**Login route setup:**

```typescript
import { LoginComponent } from '@upupa/membership';

const routes: Routes = [
  provideRoute({
    path: 'login',
    loadComponent: () => import('@upupa/membership').then(m => m.LoginComponent),
  }),
];
```

The `LoginComponent` reads IDP providers registered via `withEmailAndPassword()` and renders the appropriate form automatically.

> **Note:** The membership lib uses `$localize`. Ensure `@angular/localize/init` is listed in your app's `polyfills` in `project.json`.

---

## Complete `app.config.ts` Example

```typescript
import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconRegistry } from '@angular/material/icon';

import { provideApi } from '@upupa/data';
import { AuthInterceptor, provideAuth, withEmailAndPassword } from '@upupa/auth';
import { provideControlPanel } from '@upupa/cp';
import { provideDynamicForm } from '@upupa/dynamic-form';
import { provideDataTable } from '@upupa/table';
import { DF_MATERIAL_THEME_INPUTS } from '@upupa/dynamic-form-material-theme';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),

    // HTTP — AuthInterceptor adds Bearer token to every request
    provideHttpClient(withFetch(), withInterceptors([AuthInterceptor])),

    // Data — base URL for DataService
    provideApi('/api'),

    // Auth — email/password IDP
    provideAuth({ base_url: '/auth' }, withEmailAndPassword()),

    // Control panel shell
    provideControlPanel(),

    // Dynamic forms with Material theme
    provideDynamicForm([], { material: DF_MATERIAL_THEME_INPUTS as any }, 'material'),

    // Data table pipes and options
    provideDataTable(),

    // Use Material Symbols Outlined icon font
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),

    provideRouter(appRoutes, withComponentInputBinding()),
  ],
};
```

---

## Complete `app.routes.ts` Example

```typescript
import { Routes } from '@angular/router';
import { provideLayoutRoute, routesToActions } from '@upupa/cp';
import { provideRoute, withAction } from '@upupa/common';

import { DashboardComponent } from './dashboard/dashboard.component';
import { productRoutes } from './products/products.routes';

// These are the routes rendered inside the layout (appear in sidebar)
export const backendRoutes: Routes = [
  provideRoute(
    { path: 'dashboard', component: DashboardComponent },
    withAction({ action: 'Read:/dashboard', icon: 'dashboard', text: 'Dashboard' }),
  ),
  ...productRoutes,
];

export const appRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Login page (outside layout)
  provideRoute({
    path: 'login',
    loadComponent: () => import('@upupa/membership').then(m => m.LoginComponent),
  }),

  // Admin layout shell — sidebar auto-built from withAction metadata
  provideLayoutRoute({
    path: '',
    loginUrl: '/login',
    logo: '/assets/logo.png',
    sidebar: { useFactory: () => routesToActions(backendRoutes) },
    children: backendRoutes,
  }),

  { path: '**', redirectTo: 'dashboard' },
];
```

---

## CRUD Feature Pattern (full example)

A complete CRUD feature for a `Product` resource consists of three files:

### 1. Form viewmodel — `product.form.ts`

```typescript
import { FormViewModel, formInput, adapterSubmit } from '@upupa/cp';

@FormViewModel()
export class ProductForm {
  @formInput({ input: 'text', label: 'Name', required: true })
  name = '';

  @formInput({ input: 'number', label: 'Price', required: true })
  price = 0;

  @formInput({ input: 'textarea', label: 'Description' })
  description = '';

  async onSubmit() {
    return adapterSubmit(this);
  }
}
```

### 2. Table viewmodel — `product.table.ts`

```typescript
import { column, injectDataAdapter } from '@upupa/table';
import { editButton, deleteButton } from '@upupa/cp';
import { ProductForm } from './product.form';

export class ProductTable {
  @column({ header: 'Name', order: 1 })
  name = '';

  @column({ header: 'Price', order: 2 })
  price = 0;

  @column({
    header: ' ',
    class: 'actions',
    template: [
      editButton(ProductForm, (btn) => btn.item()),
      deleteButton((btn) => injectDataAdapter().delete(btn.item(), { refresh: true })),
    ],
  })
  actions: any;
}
```

### 3. Routes — `products.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { provideTableRoute, withHeader } from '@upupa/table';
import { createButton } from '@upupa/cp';
import { withAction } from '@upupa/common';
import { ProductForm } from './product.form';
import { ProductTable } from './product.table';

export const productRoutes: Routes = [
  provideTableRoute(
    {
      path: 'products',
      viewModel: ProductTable,
      dataAdapter: { type: 'api', path: '/products', keyProperty: '_id' } as any,
      tableHeaderComponent: withHeader(true, createButton(ProductForm)),
    },
    withAction({ action: 'Read:/products', icon: 'inventory', text: 'Products' }),
  ),
];
```

### API endpoint requirements

The API must implement:

```
GET    /api/products?page=1&per_page=20&search=query
       Response: { data: Product[] }  + header X-Total-Count: N

GET    /api/products/:id
       Response: { data: Product }

POST   /api/products
       Body: Partial<Product>
       Response: { data: Product }

PUT    /api/products/:id
       Body: Partial<Product>
       Response: { data: Product }

DELETE /api/products/:id
       Response: 204 No Content
```

---

## Additional @upupa Libraries

---

### `@upupa/common` — Shared Primitives

**Purpose:** Core shared building blocks for the entire Upupa ecosystem — base form-control class, routing utilities, SEO/metadata, theming, SSR-safe storage, and a ServiceWorker-bridging event bus.

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `InputBaseComponent<T>` | Base class | Implements `ControlValueAccessor`; manages `value`, `control`, `disabled`, `required`, `name` signals — extend to build custom form controls |
| `EventBus` | Service (`root`) | In-process pub/sub bridged to ServiceWorker `postMessage` events |
| `ThemeService` | Service | CSS-class-based theme switcher; `init(themes)`, `apply(name)`, `events$` |
| `MetadataService` | Service | SEO metadata (OpenGraph, Twitter, SchemaOrg strategies) |
| `LocalStorageService` | Service | SSR-safe `localStorage` wrapper |
| `ActionDescriptor` | Type | Shared descriptor for buttons/actions across UI libs |
| `DynamicComponent<T>` | Type | Lazily rendered component wrapper with `inputs`, `outputs`, `bindings`, `content` |
| `PortalComponent` | Component | Renders any `DynamicTemplate` into the view |
| `provideComponent<T>(template)` | Function | Normalizes a `Type<T>` or `DynamicComponent` |
| `provideRoute(route, ...features)` | Function | Attaches route metadata (action, guards, etc.) to a route definition |
| `withAction(descriptor)` | Feature fn | See `@upupa/cp` section — defined here, used everywhere |
| `RouteNavigationService` | Service | Typed navigate/router helpers |
| `ReuseAllStrategy` | Class | `RouteReuseStrategy` that reuses all components |
| `EqualDirective`, `MaxDirective`, `MinDirective`, `OnlyNumbersDirective`, `FocusDirective`, `LongPressDirective`, `NavigateToDirective` | Directives | Form & UX helpers |
| `HtmlPipe`, `MarkdownPipe` | Pipes | |
| `UtilsModule` | NgModule | Barrel module (legacy) |

**Custom form control example:**

```typescript
import { Component } from '@angular/core';
import { InputBaseComponent } from '@upupa/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<input [formControl]="control" [placeholder]="placeholder()" />`,
})
export class MyInputComponent extends InputBaseComponent<string> {
  // value, control, disabled, required are inherited as signals
}
```

---

### `@upupa/authz` — Client-side Authorization

**Purpose:** Rule-based authorization for Angular apps. Fetches a permission rule tree from a REST API and evaluates access (grant/deny) for any path + action combination per user principal.

**Setup (`app.config.ts`):**

```typescript
import { provideAuthorization } from '@upupa/authz';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuthorization('/permissions'),  // base URL for the rules API
  ]
};
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `provideAuthorization(baseUrl)` | Provider fn | Registers `PERMISSIONS_BASE_URL` token |
| `AuthorizationService` | Service | `.authorize(path, action, principle)` → `Promise<AuthorizeResult>`, exposes `rules$` |
| `AuthorizeActionDirective` (`[authAction]`) | Directive | Disables or hides host element when access is denied |
| `authGuardFn(options)` | Guard fn | Functional route guard |
| `defaultLoginRedirect(loginRoute)` | Helper | Builds redirect `UrlTree` preserving `redirectTo` query param |
| `PERMISSIONS_BASE_URL` | Token | `InjectionToken<string>` |

**Template usage:**

```html
<!-- disable button if user lacks delete permission on /products -->
<button [authAction]="'delete'" [path]="'/products'" [hideDenied]="true">
  Delete
</button>
```

**Route guard:**

```typescript
import { authGuardFn, defaultLoginRedirect } from '@upupa/authz';

{ 
  path: 'admin',
  canActivate: [authGuardFn({ 
    path: '/admin', 
    action: 'read',
    loginRedirect: defaultLoginRedirect('/login'),
  })],
}
```

**`AuthorizeActionDirective` inputs:**

| Input | Type | Description |
|-------|------|-------------|
| `[authAction]` | `string` | Action to check (e.g. `'delete'`, `'update'`) |
| `[path]` | `string` | Resource path to check against |
| `[user]` | `Principal` | Override the current user (defaults to auth service user) |
| `[disableDenied]` | `boolean` | Disable (not hide) element when denied (default `true`) |
| `[hideDenied]` | `boolean` | Hide element entirely when denied |

---

### `@upupa/dialog` — Dialog & Confirm Services

**Purpose:** High-level dialog layer on top of Angular Material CDK — typed `DialogService.open()`, a confirm dialog, a prompt dialog, and a styled snack bar service.

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `DialogService` | Service | `open<TCom>(template, config?)` → `DialogRef<TCom, TResult>` |
| `DialogRef<TCom, TResult>` | Class | `.afterClosed()` observable |
| `ConfirmService` | Service | `open(options?)` → `Promise<boolean>` |
| `PromptService` | Service | `open(options?, config?)` → `Promise<any>` |
| `SnackBarService` | Service | `openSuccess/openFailed/openWarning/openInfo/openConfirm()` |
| `DialogConfig` | Type | Extends `MatDialogConfig` with `title`, `header`, `footer`, `hideCloseButton`, `autoFullScreen` |
| `DialogPortal<C>` | Interface | Implement on hosted component to expose `dialogActions` and `onAction()` |
| `ConfirmDirective`, `PromptDirective` | Directives | Declarative dialog triggers |

**Usage:**

```typescript
import { DialogService, ConfirmService, SnackBarService } from '@upupa/dialog';

// Open any component in a dialog:
const result = await dialogService
  .open(EditProductComponent, { title: 'Edit Product', data: { product } })
  .afterClosed()
  .toPromise();

// Confirmation:
const confirmed = await confirmService.open({
  title: 'Delete product?',
  confirmText: 'This cannot be undone.',
  yes: 'Delete',
  no: 'Cancel',
});

// Snackbars:
snackBar.openSuccess('Product saved');
snackBar.openFailed('Something went wrong');
```

**`DialogPortal` interface** — implement on a dialog-hosted component to expose footer actions:

```typescript
import { DialogPortal } from '@upupa/dialog';

@Component({ ... })
export class EditProductComponent implements DialogPortal<EditProductComponent> {
  dialogActions = [
    { name: 'save', text: 'Save', color: 'primary' },
    { name: 'cancel', text: 'Cancel' },
  ];

  onAction(action: string) {
    if (action === 'save') this.save();
  }
}
```

---

### `@upupa/upload` — File Upload

**Purpose:** File upload to a configurable backend storage endpoint. Provides progress tracking via observables, clipboard utilities, and a `FileSizePipe`.

**Setup (`app.config.ts`):**

```typescript
import { provideUpload } from '@upupa/upload';

export const appConfig: ApplicationConfig = {
  providers: [
    provideUpload('/api/storage'),  // base URL for the storage API
  ]
};
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `provideUpload(baseUrl)` | Provider fn | Registers `STORAGE_BASE` token + services |
| `UploadClient` | Service | Path-relative helpers: `upload(path, file)`, `delete(path)`, `overwrite(path, file)`, `get(path)` |
| `UploadService` | Service | Low-level: `upload(url, file, name)` → `UploadStream`, `delete(url)`, `uploadContent()` |
| `UploadStream` | Model | `progress$: BehaviorSubject<number>`, `response$: Subject<FileInfo>` |
| `FileInfo` | Model | `{ name, path, size, mimeType, ... }` |
| `FileSizePipe` | Pipe | Human-readable file sizes |
| `STORAGE_BASE` | Token | `InjectionToken<string>` |

**Usage:**

```typescript
import { UploadClient, FileSizePipe } from '@upupa/upload';

// In a component:
const uploadClient = inject(UploadClient);

async uploadFile(file: File) {
  const stream = uploadClient.upload('/images', file, file.name);
  stream.progress$.subscribe(p => console.log(`${p}%`));
  const info = await stream.response$.toPromise();
  console.log('Uploaded to:', info.path);
}
```

---

### `@upupa/language` — i18n & Translation

**Purpose:** i18n library managing active language from route parameters, RTL/LTR direction sync on the `<html>` element, and key-based string translation via a static dictionary.

**Setup:**

```typescript
import { LanguageModule } from '@upupa/language';

@NgModule({
  imports: [
    LanguageModule.forRoot(
      'en',   // default language
      {
        en: { greeting: 'Hello', save: 'Save' },
        ar: { greeting: 'مرحبا', save: 'حفظ' },
      },
    ),
  ]
})
export class AppModule {}
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `LanguageModule.forRoot(defaultLang, dictionaries, routeVarName?)` | NgModule | Main setup |
| `TranslationModule` | NgModule | Lightweight — re-exports `TextPipe` only |
| `LanguageService` | Service | `language`, `language$`, `dir$`, `validateLang()` |
| `TranslateService` | Service | `translate$(key, ...params)`, `translate(key, lang)` |
| `TextPipe` | Pipe | Template binding for `TranslateService` |
| `languagesList` | Constant | List of all language metadata objects |
| `languageDir(lang)` | Function | Returns `'ltr'` or `'rtl'` for a language code |

**Template usage:**

```html
<!-- Using the pipe -->
<span>{{ 'greeting' | text }}</span>

<!-- Switching language -->
<button (click)="langService.apply('ar')">عربي</button>
```

---

### `@upupa/mat-btn` — Action Button Component

**Purpose:** Renders Angular Material buttons driven entirely by an `ActionDescriptor` object, with integrated loading state, `[authAction]` authorization check, and badge support.

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `MatBtnComponent` (`<mat-btn>`) | Component | Descriptor-driven button |
| `ActionDescriptorComponent` (`<mat-action>`) | Component | Convenience wrapper |

**`ActionDescriptor` shape:**

```typescript
import { ActionDescriptor } from '@upupa/common';

const saveAction: ActionDescriptor = {
  name: 'save',         // identifier (emitted on click)
  text: 'Save',         // label
  icon: 'save',         // Material Symbol icon
  color: 'primary',     // 'primary' | 'accent' | 'warn'
  variant: 'raised',    // 'raised' | 'flat' | 'stroked' | 'icon' | 'fab' | 'mini-fab' | ''
  action: 'Write:/path', // optional — passed to [authAction] for permission check
};
```

**Usage:**

```html
<mat-btn
  [buttonDescriptor]="saveAction"
  [loading]="isSaving"
  [context]="formData"
  (action)="onAction($event)"
/>
```

**`(action)` event** emits `ActionEvent = { action: ActionDescriptor, data: any, context: any }`.

---

### `@upupa/popover` — Overlay Popover

**Purpose:** CDK Overlay-based popover panel for rich content (not just tooltips), with configurable position, animation, trigger event (hover/click), and scroll strategy.

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `PopoverComponent` (`<popover>`) | Component | Panel container; `exportAs: 'popover'` |
| `PopoverTrigger` (`[popoverTriggerFor]`) | Directive | Attaches overlay logic to any host element |
| `PopoverModule` | NgModule | |

**Popover inputs:**

| Input | Default | Description |
|-------|---------|-------------|
| `positionX` | `'after'` | `'before' \| 'after'` |
| `positionY` | `'below'` | `'above' \| 'below'` |
| `triggerEvent` | `'hover'` | `'hover' \| 'click'` |
| `enterDelay` | `200` | ms before opening on hover |
| `leaveDelay` | `200` | ms before closing on hover |
| `arrowColor` | `''` | CSS color for the arrow |

**Usage:**

```html
<button [popoverTriggerFor]="infoPopover">
  Info <mat-icon>info</mat-icon>
</button>

<popover #infoPopover [triggerEvent]="'hover'" [positionY]="'above'">
  <mat-card>
    <p>Additional details here</p>
  </mat-card>
</popover>
```

---

### `@upupa/tags` — Hierarchical Tag Management

**Purpose:** Hierarchical tag management — CRUD operations via `DataService`, a tree viewer component, and a chips-based selection input.

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `TagsService` | Service | `getChildrenOf(parentPath)`, `getByPath()`, `getTagById()`, `create/update/delete` via `DataService` |
| `TagsComponent` (`<tags-tree>`) | Component | Tree view with add/edit/remove node actions |
| `TagFormComponent` | Component | Form for creating/editing a single tag |
| `TagsPipe` | Pipe | Resolves tag IDs to names |
| `Tag` | Model | `{ _id, name, slug, parentPath, ... }` |
| `TagsModule` | NgModule | |

**`Tag` model:**

```typescript
interface Tag {
  _id: string;
  name: string;
  slug: string;
  parentPath: string;   // parent tag's _id, or '' for root tags
  description?: string;
}
```

**Usage:**

```html
<!-- Tree editor — allows adding/editing/removing nested tags -->
<tags-tree [path]="'/api/tags'" />
```

---

### `@upupa/permissions` — Permissions Admin UI

**Purpose:** Admin UI for managing hierarchical RBAC permissions — viewing the rule tree, assigning permissions per role/user, and editing rules. Backed by `@upupa/authz` service.

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `PermissionsService` | Service | `getUserPermissions(userId)`, `getRules()`, `addOrUpdatePermission()`, `restorePermissions()`, `roles$` |
| `PermissionsPageComponent` | Component | Full-page permissions manager |
| `PermissionsSideBarComponent` | Component | Sidebar navigation for rules |
| `RuleFormComponent` | Component | Create/edit a single permission rule |
| `RulePermissionsTableComponent` | Component | Table of permissions for a rule |
| `UserRole` | Type | `{ _id: string, name: string }` |
| `appDefaultAdminRoles` | Constant | Pre-built `super-admin`, `admin`, `developer` role objects |

**Usage:**

```typescript
// In routes:
{ path: 'permissions', component: PermissionsPageComponent }
```

---

### `@upupa/widget` — Dashboard Builder

**Purpose:** GridStack-based dashboard builder. Consumers define `WidgetBlueprint[]` (each is a component + optional settings form); the builder lets users arrange widgets in a 12-column responsive grid and persists layout as a `Widget[]` JSON value.

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `WidgetBuilderComponent` (`<widget-builder>`) | Component | Interactive GridStack editor; implements `ControlValueAccessor`; value is `Widget[]` |
| `WidgetLayoutComponent` (`<widget-layout>`) | Component | Read-only grid renderer |
| `WidgetSelectorComponent` | Component | Palette of blueprints to pick from |
| `WidgetSettingsComponent` | Component | Settings form for a selected widget |
| `HtmlWidget`, `ImgWidget`, `MdWidget`, `TextWidget`, `MediaImgWidget` | Built-in blueprints | Ready-to-use widget types |
| `Widget` | Model | `{ id, blueprintId, x, y, w, h, settings }` |
| `WidgetBlueprint<T>` | Type | `{ id, label, component, settingsForm?, defaultSettings? }` |
| `materializeWidget()`, `deMaterializeWidget()` | Helpers | Convert between stored and rendered forms |

**Usage:**

```typescript
const blueprints: WidgetBlueprint[] = [
  HtmlWidget,
  MdWidget,
  {
    id: 'kpi-card',
    label: 'KPI Card',
    component: KpiCardComponent,
    settingsForm: KpiCardSettingsForm,
    defaultSettings: { title: 'Total Users', metric: 'users.total' },
  },
];
```

```html
<!-- Builder (editor mode) -->
<widget-builder [blueprints]="blueprints" [(ngModel)]="layout" />

<!-- Viewer (display mode) -->
<widget-layout [blueprints]="blueprints" [widgets]="layout" />
```

---

### `@upupa/html-editor` — Rich Text Editor (CKEditor 4)

**Purpose:** CKEditor 4 rich-text editor wrapped as an Angular `ControlValueAccessor` component. Loads the CKEditor script dynamically and integrates with `@upupa/upload` for image uploading.

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `CKEditor4Component` (`<form-html>`) | Component | `ControlValueAccessor` for HTML content |
| `FULL_TOOLBAR` | Constant | Full CKEditor toolbar config |
| `SMART_TOOLBAR` | Constant | Compact CKEditor toolbar config |

**Inputs:**

| Input | Type | Description |
|-------|------|-------------|
| `uploadPath` | `string` | Storage path for uploaded images (requires `@upupa/upload`) |
| `config` | `CKEDITOR.config` | Custom CKEditor config (merged with defaults) |
| `language` | `string` | Editor UI language |
| `dir` | `'ltr' \| 'rtl'` | Text direction |
| `readonly` | `boolean` | |
| `placeholder` | `string` | |

**Usage:**

```html
<form-html
  [formControlName]="'body'"
  [uploadPath]="'/uploads/articles'"
  [config]="{ toolbar: SMART_TOOLBAR }"
/>
```

---

### `@upupa/editor-js` — Block Editor (EditorJS)

**Purpose:** Block-based rich-text editor using [EditorJS](https://editorjs.io), loaded via dynamic `<script>` injection. Implements `ControlValueAccessor` with value type `OutputData`. Supports an optional AI prompt callback.

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `EditorJsInputComponent` (`<editor-js-input>`) | Component | `ControlValueAccessor`; extends `InputBaseComponent<OutputData>` |
| `EDITOR_JS_AI_PROMPT` | Token | `InjectionToken<(text: string) => Promise<any>>` — inject to enable AI text suggestions |

**Usage:**

```typescript
// app.config.ts — optional AI hook
{
  provide: EDITOR_JS_AI_PROMPT,
  useValue: async (text: string) => callMyAiEndpoint(text),
}
```

```html
<editor-js-input
  [formControlName]="'content'"
  [placeholder]="'Start writing...'"
  [readOnly]="false"
/>
```

**Value type** is `OutputData` (EditorJS output):

```typescript
interface OutputData {
  time: number;
  blocks: { type: string; data: Record<string, any> }[];
  version: string;
}
```

---

## @ss Library Reference (Server-side)

All `@ss/*` libraries are NestJS modules. They are consumed server-side via TypeScript path aliases — no npm publishing needed.

**Available packages:**

| Package | Path alias | Purpose |
|---------|-----------|---------|
| `@ss/common` | `@ss/common` | Infrastructure: Redis, event bus, WebSocket gateway, `@EndPoint` decorator, bootstrap helper |
| `@ss/data` | `@ss/data` | MongoDB data access (multi-DB, CRUD, aggregation, JSON Patch, migrations) |
| `@ss/auth` | `@ss/auth` | JWT authentication — signup/login/token/OAuth (Google + Facebook) |
| `@ss/users` | `@ss/users` | User management facade + super-admin auto-provisioning |
| `@ss/api` | `@ss/api` | Wildcard REST CRUD controller delegating to `DataService` + `AuthorizeService` |
| `@ss/rules` | `@ss/rules` | Path-based RBAC with expression engine, global `AuthorizeInterceptor` |
| `@ss/storage` | `@ss/storage` | File upload/download/delete with MongoDB metadata storage |
| `@ss/notifications` | `@ss/notifications` | Multi-channel notifications (SMTP, SendGrid, Twilio, WebSocket) |

---

### `@ss/common` — Infrastructure

**Purpose:** Cross-cutting infrastructure. Provides a Redis client wrapper (ioredis), in-process event bus with optional Redis-backed broker, Socket.IO WebSocket gateway with Redis adapter, the `@EndPoint` unified routing decorator (HTTP + WebSocket + microservice in one), app bootstrap helper, error handling, and a structured logger.

**Registration:**

```typescript
import { CommonModule } from '@ss/common';

@Module({
  imports: [
    CommonModule.register({
      broker: 'bus',          // 'bus' = in-process | 'REDIS_DEFAULT' = Redis transport
    }),
  ]
})
export class AppModule {}
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `CommonModule` | NestJS module | |
| `EventBusService` | Service | In-process pub/sub |
| `RedisClient` | Class | ioredis wrapper (Cluster-aware) |
| `Broker` / `BrokerController` | Service + Controller | Message broker |
| `WebsocketsGateway` | Gateway | Socket.IO gateway |
| `EndPoint` | Decorator | Unified HTTP + WebSocket + microservice routing |
| `HttpGetEndpoint` / `HttpPostEndpoint` | Decorators | Convenience `@EndPoint` wrappers |
| `Message` | Param decorator | Extracts `IncomingMessage` |
| `AppError` / `HttpExceptionFilter` | Error / Filter | Error handling |
| `bootstrap(AppModule, AppOptions)` | Helper | NestJS app bootstrap with cluster support |
| `_env_secret()` | Utility | Reads `secret` / `SECRET` env var |
| `sha256` | Utility | |
| `logger` | Structured logger | |

**`@EndPoint` decorator:**

```typescript
import { EndPoint } from '@ss/common';

@Controller('orders')
class OrdersController {
  @EndPoint({
    http: { method: 'POST', path: ':id/confirm' },
    operation: 'ConfirmOrder',
    cmd: 'order.confirm',      // microservice command
  })
  confirm(@Message() msg: IncomingMessage) { ... }
}
```

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `REDIS_DEFAULT` | Default Redis `host:port` |
| `REDIS_*` | Any `REDIS_*` env var auto-provisions a named `RedisClient` |
| `secret` / `SECRET` | Shared app secret |
| `NODE_ENV` | Environment name |

---

### `@ss/data` — MongoDB Data Layer

**Purpose:** Multi-connection MongoDB data access on top of Mongoose. `DataService` provides generic CRUD, aggregation pipeline querying, JSON Patch application, change events via `Broker`, and schema migrations.

**Registration:**

```typescript
import { DataModule } from '@ss/data';

@Module({
  imports: [
    DataModule.register({
      DB_DEFAULT: {
        uri: process.env.DB_DEFAULT,      // required
        models: {
          product: { schema: productSchema },
          order: { schema: orderSchema },
        },
        migrations: [new AddIndexMigration()],  // optional
      },
      DB_LOGS: {
        uri: process.env.DB_LOGS,
        models: { log: { schema: logSchema } },
      },
    }),
  ]
})
export class AppModule {}
```

**Injecting `DataService`:**

```typescript
import { DataService, getDataServiceToken } from '@ss/data';

@Injectable()
class ProductService {
  constructor(
    @Inject(getDataServiceToken('DB_DEFAULT')) private data: DataService
  ) {}

  async getProducts(query = {}) {
    return this.data.get('/product', query);
  }

  async createProduct(dto: CreateProductDto) {
    return this.data.post('/product', dto);
  }

  async updateProduct(id: string, patch: Patch[]) {
    return this.data.patch(`/product/${id}`, patch);
  }
}
```

**Key `DataService` methods:**

| Method | Description |
|--------|-------------|
| `get(path, query?)` | List or get by ID |
| `post(path, body)` | Create |
| `put(path, body)` | Replace |
| `patch(path, patch[])` | JSON Patch update |
| `delete(path)` | Delete |
| `agg(collection, pipeline[])` | Raw aggregation pipeline |
| `addModel(name, schema, dbName?)` | Register a model at runtime |

**Implementing a migration:**

```typescript
import { IDbMigration } from '@ss/data';

export class AddSlugIndexMigration implements IDbMigration {
  version = '1.0.0';
  async up(db: Connection) {
    await db.collection('products').createIndex({ slug: 1 }, { unique: true });
  }
  async down(db: Connection) {
    await db.collection('products').dropIndex('slug_1');
  }
}
```

**Environment variables:**

| Variable | Description |
|----------|-------------|
| `DB_DEFAULT` | MongoDB URI (**required**) |
| `DB_[NAME]` | Additional named database URIs |
| `DB_[NAME]_PREFIX` | Collection prefix per named DB |

---

### `@ss/auth` — JWT Authentication

**Purpose:** Full JWT authentication system — signup, login, access/refresh/reset/verify token flows, session management, email/phone verification codes, and OAuth (Google + Facebook via Passport). `AuthenticationInterceptor` attaches the decoded `principle` to every request globally.

**Registration:**

```typescript
import { AuthModule } from '@ss/auth';

@Module({
  imports: [
    DataModule.register({ DB_DEFAULT: { uri: process.env.DB_DEFAULT, models: {} } }),
    AuthModule.register(
      { dbName: 'DB_DEFAULT', userSchema: userSchemaFactory('ObjectId') },
      {
        sendWelcomeEmail: true,
        forceEmailVerification: false,
        accessTokenExpiry: '20m',
        refreshTokenExpiry: '7 days',
      }
    ),
  ]
})
export class AppModule {}
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `AuthModule` | NestJS module | Global module |
| `AuthService` | Service | `signUp`, `login`, `verifyToken`, `sign`, `addUserToRoles`, `changeUserToRoles`, `removeUserRoles` |
| `TokenService` | Service | JWT sign/verify |
| `SessionService` | Service | Refresh token / session management |
| `VerificationService` | Service | Email/phone verification code flow |
| `ProviderAuthService` | Service | OAuth integration (Google/Facebook) |
| `AuthenticationInterceptor` | Global interceptor | Attaches decoded `principle` to all requests |
| `AuthenticatedInterceptor` + `Auth()` | Interceptor + Decorator | Enforces authentication on a route |
| `Principle` | Param decorator | Injects the current user from request context |
| `userSchema` / `roleSchema` | Mongoose schemas | Default user and role schemas |

**Protecting a route:**

```typescript
import { Auth, Principle } from '@ss/auth';

@Controller('profile')
class ProfileController {
  @Get()
  @Auth()  // reject unauthenticated requests
  getProfile(@Principle() user: UserDocument) {
    return user;
  }
}
```

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `secret` / `SECRET` | — | JWT signing secret (**required**) |
| `accessTokenExpiry` | `"20m"` | Access token lifetime |
| `refreshTokenExpiry` | `"7 days"` | Refresh token lifetime |
| `resetTokenExpiry` | `"10m"` | Password reset token lifetime |
| `forceEmailVerification` | `"false"` | Require email verification before login |
| `sendWelcomeEmail` | `"false"` | Send welcome email on signup |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | Google OAuth |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | — | Facebook OAuth |
| `CLIENT_URL` | — | Frontend URL (OAuth redirect) |
| `CALLBACK_BASE` | — | Base URL for OAuth callbacks |

---

### `@ss/users` — User Management

**Purpose:** User management facade that wraps `AuthService` to expose `UsersController` for user CRUD. Auto-provisions a super-admin user on startup using the configured credentials.

**Registration:**

```typescript
import { UsersModule } from '@ss/users';

@Module({
  imports: [
    UsersModule.register({
      superAdmin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        name: 'Super Admin',
      }
    }),
  ]
})
export class AppModule {}
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `UsersModule` | NestJS module | Includes `EventEmitterModule.forRoot()` |
| `UsersController` | Controller | User management REST endpoints |
| `UsersOptions` | Config | `{ superAdmin: { email, password, username?, name? } }` |

---

### `@ss/rules` — Path-based RBAC

**Purpose:** URL-path-based authorization backed by a tree-structured rule engine (`@noah-ark/expression-engine`). Rules define action-level grant/deny per role/expression. `AuthorizeInterceptor` is auto-registered globally and evaluates every request against the rule tree using operation metadata set by `@EndPoint` (or `@Authorize`).

**Registration:**

```typescript
import { RulesModule, DenyRule } from '@ss/rules';
import { provideApiRulesFromPaths } from '@ss/api';

@Module({
  imports: [
    RulesModule.register(
      { dbName: 'DB_DEFAULT', permissionSchema: SimplePermissionSchema },
      DenyRule,                                         // default deny-all root rule
      provideApiRulesFromPaths(['products', 'orders']), // grant all ops to super-admin
    ),
  ]
})
export class AppModule {}
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `RulesModule` | NestJS module | Registers `AuthorizeInterceptor` as `APP_INTERCEPTOR` |
| `RulesService` | Service | `addRule`, `getRule`, `getRules`, `updatePermission`, `deletePermission` |
| `AuthorizeService` | Service | `authorize(msg, action?, additional?)` → `AuthorizeResult` |
| `AuthorizeInterceptor` | Global interceptor | Auto-registered — evaluates every request |
| `PermissionController` | Controller | REST CRUD for `/permission` |
| `Authorize` | Decorator | Attaches operation metadata to a handler |
| `GrantRule` / `DenyRule` / `rootRule()` | Presets | Root rule presets |
| `SimplePermissionSchema` | Mongoose schema | Default permission document schema |

**Permission structure:**
- Rules are stored as a tree keyed by resource path (e.g. `/products`, `/products/:id`)
- Each node defines grant/deny per action (`Create`, `Read`, `Update`, `Delete`, `Patch`, `Export`) per role or expression
- The rule engine walks up the tree for the closest matching ancestor if no exact rule exists

---

### `@ss/api` — Wildcard REST CRUD

**Purpose:** A generic wildcard REST CRUD controller (`/api/{*path}`) that delegates all operations to `DataService` after authorization checks via `AuthorizeService`. Handles GET (list + by-id), POST, PUT, PATCH (JSON Patch), DELETE, and export. Also provides a Google reCAPTCHA v2 verification service.

**Registration:**

```typescript
import { ApiModule } from '@ss/api';

@Module({
  imports: [
    DataModule.register({ ... }),
    RulesModule.register(...),
    ApiModule.register(),   // no options needed
  ]
})
export class AppModule {}
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `ApiModule` | NestJS module | Global module |
| `ApiController` | Controller | Wildcard `/api/{*path}` handler |
| `reCAPTCHAService` | Service | Google reCAPTCHA v2 token verification |
| `provideApiRulesFromPaths(paths[])` | Helper | Generates `Rule[]` granting all CRUD ops on given paths to `super-admin` |
| `_query()` | Utility | URL/querystring parser used by `ApiController` |

**`provideApiRulesFromPaths` usage:**

```typescript
// Automatically generates grant rules for all ops on /products and /orders
provideApiRulesFromPaths(['products', 'orders'])
```

---

### `@ss/storage` — File Storage

**Purpose:** File upload and storage. Files are saved to disk under `STORAGE_DIR` and metadata is persisted to MongoDB. Provides REST endpoints for upload/download/delete and a separate image controller for serving and transforming images (via `sharp`).

**Registration:**

```typescript
import { StorageModule } from '@ss/storage';

@Module({
  imports: [
    StorageModule.register({
      dbName: 'DB_DEFAULT',
      storageSchema: FileSchema,  // optional — defaults to built-in schema
      prefix: 'app_',             // optional — collection name prefix
    }),
  ]
})
export class AppModule {}
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `StorageModule` | NestJS module | |
| `StorageService` | Service | `upload`, `list`, `get`, `delete`, `move` |
| `StorageController` | Controller | REST file endpoints |
| `ImageService` | Service | Image processing/transforms (requires `sharp`) |
| `ImageController` | Controller | REST image endpoints |
| `FileSchema` | Mongoose schema | Default file metadata schema |
| `getStorageDir()` | Utility | Resolves `STORAGE_DIR` env var |

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_DIR` | `__dirname` | Root directory for stored files |

**REST endpoints exposed:**

```
POST   /storage/:path          Upload file
GET    /storage/:path          Download file
DELETE /storage/:path          Delete file
GET    /image/:path            Serve image (supports query: ?w=200&h=200&fit=cover)
```

---

### `@ss/notifications` — Multi-Channel Notifications

**Purpose:** Multi-channel notification system with topic-based routing. Topics map to one or more channels (SMTP, SendGrid, Twilio SMS, WebSocket push). `NotificationService.send()` fans out to all configured channels, loads missing recipient fields from the DB, filters unsubscribed users, and optionally persists `NotificationRecord`s to MongoDB.

**Registration:**

```typescript
import { NotificationsModule, SMTPMailer, SMTPConfig, TwilioService } from '@ss/notifications';

@Module({
  imports: [
    NotificationsModule.register(
      // Channels — instances or NestJS Provider objects:
      [
        new SMTPMailer(new SMTPConfig()),
        new TwilioService(process.env.TWILIO_SID, process.env.TWILIO_TOKEN),
      ],
      // Topics — topic name → { channels[] }:
      {
        welcome:      { channels: ['smtp'] },
        otp:          { channels: ['twilio'] },
        announcement: { channels: ['smtp', 'push'] },
      },
      // Config:
      {
        dbName: 'DB_DEFAULT',
        notificationSchema: new Schema({}, { strict: false }),
        readNotificationSettings: true,   // honour user unsubscribe preferences
      }
    ),
  ]
})
export class AppModule {}
```

**Sending a notification:**

```typescript
import { NotificationService } from '@ss/notifications';

@Injectable()
class WelcomeService {
  constructor(private notifications: NotificationService) {}

  async sendWelcome(userId: string) {
    await this.notifications.send({
      topic: 'welcome',
      to: [userId],                          // user IDs — fields loaded from DB
      template: 'welcome',                   // Handlebars template name
      subject: 'Welcome!',
      data: { name: 'John' },                // template variables
    });
  }
}
```

**Key exports:**

| Export | Type | Description |
|--------|------|-------------|
| `NotificationsModule` | NestJS module | |
| `NotificationService` | Service | `send(notification, options?)`, `addChannels(topic, ...channels)` |
| `NotificationChannel<N>` | Interface | Implement to create a custom channel |
| `SMTPMailer` / `SMTPConfig` | Email channel | nodemailer-based |
| `SendGridMailer` | Email channel | SendGrid API |
| `TwilioService` | SMS channel | Twilio API |
| `PushChannel` / `WsChannel` | Push / WebSocket channels | |
| `Notification` | Model | `{ topic, to[], template?, subject?, data? }` |
| `DeliveryReport` | Result | `{ sent[], notSent[] }` |

**Environment variables (SMTP):**

| Variable | Description |
|----------|-------------|
| `FROM_ADDRESS` | Sender email address |
| `FROM_NAME` | Sender display name |
| `SMTP_HOST` / `SMTP_PORT` | SMTP server |
| `SMTP_AUTH_USER` / `SMTP_AUTH_PASS` | SMTP credentials |
| `SMTP_SECURE` | `"true"` for TLS |
| `TEMPLATE_BASE` | Path to Handlebars email template directory |

---

## Full Server-side App Setup (NestJS)

A minimal NestJS app using all `@ss` modules:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule, bootstrap } from '@ss/common';
import { DataModule } from '@ss/data';
import { AuthModule } from '@ss/auth';
import { UsersModule } from '@ss/users';
import { RulesModule, DenyRule } from '@ss/rules';
import { ApiModule, provideApiRulesFromPaths } from '@ss/api';
import { StorageModule, FileSchema } from '@ss/storage';
import { NotificationsModule, SMTPMailer, SMTPConfig } from '@ss/notifications';
import { userSchemaFactory } from '@ss/auth';
import { SimplePermissionSchema } from '@ss/rules';

const RESOURCES = ['products', 'orders', 'users', 'storage'];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule.register({ broker: 'bus' }),
    DataModule.register({
      DB_DEFAULT: {
        uri: process.env.DB_DEFAULT,
        models: { /* your models */ },
      },
    }),
    AuthModule.register(
      { dbName: 'DB_DEFAULT', userSchema: userSchemaFactory('ObjectId') },
      { sendWelcomeEmail: true }
    ),
    UsersModule.register({
      superAdmin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        name: 'Super Admin',
      }
    }),
    RulesModule.register(
      { dbName: 'DB_DEFAULT', permissionSchema: SimplePermissionSchema },
      DenyRule,
      provideApiRulesFromPaths(RESOURCES),
    ),
    ApiModule.register(),
    StorageModule.register({ dbName: 'DB_DEFAULT', storageSchema: FileSchema }),
    NotificationsModule.register(
      [new SMTPMailer(new SMTPConfig())],
      { welcome: { channels: ['smtp'] } },
      { dbName: 'DB_DEFAULT', notificationSchema: new Schema({}, { strict: false }) }
    ),
  ],
})
export class AppModule {}

// main.ts
bootstrap(AppModule, { port: 3333 });
```
