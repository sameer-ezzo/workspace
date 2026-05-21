# @upupa / workspace

A collection of Angular (client) and NestJS (server) libraries for building admin control panels with data-driven CRUD interfaces, authentication, and dynamic forms.

## Documentation

### Getting Started

| Guide | Contents |
|-------|----------|
| **[Getting Started](./docs/get-started.md)** | NX workspace setup, TypeScript config, git submodule, tsconfig paths |
| **[Client-side Integration](./docs/get-started.md#client-side-integration)** | App config, TypeScript settings, required packages |
| **[Full `app.config.ts`](./docs/get-started.md#complete-appconfigts-example)** | Copy-paste ready app config |
| **[Full `app.routes.ts`](./docs/get-started.md#complete-approutests-example)** | Copy-paste ready routes config |
| **[CRUD Feature Pattern](./docs/get-started.md#crud-feature-pattern-full-example)** | Complete form + table + routes for any resource |
| **[Full NestJS App Setup](./docs/get-started.md#full-server-side-app-setup-nestjs)** | Minimal NestJS app using all @ss modules |

### @upupa — Angular Client Libraries

| Package | Guide | Purpose |
|---------|-------|---------|
| `@upupa/common` | [docs](./docs/get-started.md#upupacommon--shared-primitives) | Base form control, event bus, theming, SEO, routing utilities |
| `@upupa/data` | [docs](./docs/get-started.md#upupadata--http-data-layer) | `provideApi`, `DataService`, `DataAdapterDescriptor` |
| `@upupa/auth` | [docs](./docs/get-started.md#upupaauth--authentication) | `provideAuth`, `withEmailAndPassword`, `AuthInterceptor`, `AuthGuard` |
| `@upupa/authz` | [docs](./docs/get-started.md#upupaauthoriz--client-side-authorization) | `provideAuthorization`, `AuthorizationService`, `[authAction]` directive, `authGuardFn` |
| `@upupa/cp` | [docs](./docs/get-started.md#upupacp--control-panel-layout) | `provideLayoutRoute`, `routesToActions`, `withAction`, layout shell |
| `@upupa/table` | [docs](./docs/get-started.md#upupatable--data-table) | `provideDataTable`, `@column`, `provideTableRoute`, `withHeader`, `injectDataAdapter` |
| `@upupa/dynamic-form` | [docs](./docs/get-started.md#upupadynamic-form--dynamic-forms) | `provideDynamicForm`, `@FormViewModel`, `@formInput`, `adapterSubmit` |
| `@upupa/cp` (buttons) | [docs](./docs/get-started.md#upupacp--form-dialog-buttons) | `createButton`, `editButton`, `deleteButton` |
| `@upupa/membership` | [docs](./docs/get-started.md#upupamembership--login--user-management) | `LoginComponent`, login route setup |
| `@upupa/dialog` | [docs](./docs/get-started.md#upupadialog--dialog--confirm-services) | `DialogService`, `ConfirmService`, `SnackBarService`, `DialogPortal` |
| `@upupa/upload` | [docs](./docs/get-started.md#upupaupload--file-upload) | `provideUpload`, `UploadClient`, `UploadStream`, `FileSizePipe` |
| `@upupa/language` | [docs](./docs/get-started.md#upupalanguage--i18n--translation) | `LanguageModule.forRoot`, `TranslateService`, `TextPipe` |
| `@upupa/mat-btn` | [docs](./docs/get-started.md#upupamat-btn--action-button-component) | `MatBtnComponent` — descriptor-driven Material buttons |
| `@upupa/popover` | [docs](./docs/get-started.md#upupapopover--overlay-popover) | `PopoverComponent`, `[popoverTriggerFor]` directive |
| `@upupa/tags` | [docs](./docs/get-started.md#upupatags--hierarchical-tag-management) | `TagsService`, `<tags-tree>` component |
| `@upupa/permissions` | [docs](./docs/get-started.md#upupapermissions--permissions-admin-ui) | `PermissionsPageComponent`, `PermissionsService` |
| `@upupa/widget` | [docs](./docs/get-started.md#upupawidget--dashboard-builder) | `<widget-builder>`, `<widget-layout>`, `WidgetBlueprint` |
| `@upupa/html-editor` | [docs](./docs/get-started.md#upupahtml-editor--rich-text-editor-ckeditor-4) | `<form-html>` — CKEditor 4 rich-text input |
| `@upupa/editor-js` | [docs](./docs/get-started.md#upupaeditor-js--block-editor-editorjs) | `<editor-js-input>` — EditorJS block editor |

### @ss — NestJS Server Libraries

| Package | Guide | Purpose |
|---------|-------|---------|
| `@ss/common` | [docs](./docs/get-started.md#sscommon--infrastructure) | Redis, event bus, WebSocket gateway, `@EndPoint`, bootstrap helper |
| `@ss/data` | [docs](./docs/get-started.md#ssdata--mongodb-data-layer) | Multi-DB MongoDB: CRUD, aggregation, JSON Patch, migrations |
| `@ss/auth` | [docs](./docs/get-started.md#ssauth--jwt-authentication) | JWT auth: signup/login/token/OAuth (Google + Facebook) |
| `@ss/users` | [docs](./docs/get-started.md#ssusers--user-management) | User CRUD facade + super-admin auto-provisioning |
| `@ss/api` | [docs](./docs/get-started.md#ssapi--wildcard-rest-crud) | Wildcard `/api/{*path}` CRUD controller |
| `@ss/rules` | [docs](./docs/get-started.md#ssrules--path-based-rbac) | Path-based RBAC + global `AuthorizeInterceptor` |
| `@ss/storage` | [docs](./docs/get-started.md#ssstorage--file-storage) | File upload/download/delete + image transforms |
| `@ss/notifications` | [docs](./docs/get-started.md#ssnotifications--multi-channel-notifications) | SMTP / SendGrid / Twilio / WebSocket notifications |
