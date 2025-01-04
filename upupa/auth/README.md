# upupa-auth

This library was generated with [Nx](https://nx.dev).

## Running unit tests

Run `nx test upupa-auth` to execute the unit tests.

## Usage

To configure authentication providers, you can use the `provideAuth` function along with `withEmailAndPassword` and `withGoogleAuth` functions inside you app.config.ts.

Example:
```typescript
import { provideAuth } from '@upupa/auth';
import { environment } from '../environments/environment';
import { PasswordStrength } from '@upupa/common';
import { withEmailAndPassword, withGoogleAuth } from '@upupa/auth';

const on_login_success = (instance, response) => {
    // handle successful login
    const router = instance.injector.get(Router)
    router.navigate(['/home'])
};

const on_login_error = (instance, error) => {
    // handle login error
};

const googleIdpOption = {
    clientId: 'your-google-client-id',
    attributes: {
        context: 'signin',
        callback: 'signin',
        nonce: '',
        auto_select: 'false',
        itp_support: 'true',
        ux_mode: 'popup',
        scope: 'profile email openid',
    },
    customize: {
        class: 'g_id_signin',
        type: 'standard',
        size: 'large',
        theme: 'outline',
        text: 'sign_in_with',
        shape: 'pill',
        logo_alignment: 'left',
    },
};

provideAuth(
    {
        base_url: environment.auth_url,
        password_policy: new PasswordStrength(),
    },
    withEmailAndPassword({
        on_success: on_login_success,
        on_error: on_login_error,
    }),
    withGoogleAuth({
        ...googleIdpOption,
        on_success: on_login_success,
        on_error: on_login_error,
    }),
);