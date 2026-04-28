# noah-ark-common

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test noah-ark-common` to execute the unit tests via [Jest](https://jestjs.io).

## Recent Changes

- Added shared auth contracts in `src/lib/auth-contract.ts` and exported them from the package entrypoint.
- Added shared request/response and auth constants to keep client/server auth integration type-safe.

## Usage Notes

Use shared auth contracts from this package in both frontend and backend code to avoid payload drift:

```ts
import {
	AuthErrorCode,
	AuthTokenType,
	SigninRequest,
	SigninResponse,
} from '@noah-ark/common';

const payload: SigninRequest = {
	grant_type: 'password',
	username: 'teacher@school.com',
	password: '***',
};
```
