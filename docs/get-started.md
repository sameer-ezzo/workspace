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
#### Configuring Client-side app to use @upupa modules
*Documentation coming soon*
