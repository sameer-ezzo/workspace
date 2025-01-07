import { Provider, EnvironmentProviders } from "@angular/core";
import { AUTH_IDPs, IdProviderOptions } from "../types";
import { GOOGLE_ID_PROVIDER_OPTIONS, GoogleIdProviderService } from "./google-id-provider.service";
import { loadScript } from "@noah-ark/common";
import { isPlatformBrowser } from "@angular/common";

export type GoogleIdProviderOptions = {
    /*
    This field is your application's client ID, which is found and created in the Google Cloud console.
    */
    client_id: string;

    attributes?: {
        /*
    This field determines if an ID token is automatically returned without any user interaction when there's only one Google session that has approved your app before. The default value is false
    */
        auto_select?: boolean;

        /*
        This field is the JavaScript function that handles the ID token returned from the One Tap prompt or the pop-up window. This attribute is required if Google One Tap or the Sign In With Google button popup UX mode is used
         */
        callback: (e) => void;
        /*
This field is the name of the JavaScript function that handles the password credential returned from the browser's native credential manager.
 */
        native_callback?: (e) => void;

        /*
        This field sets whether or not to cancel the One Tap request if a user clicks outside the prompt. The default value is true. You can disable it if you set the value to false.
        */
        cancel_on_tap_outside?: boolean;

        /*
        This attribute sets the DOM ID of the container element. If it's not set, the One Tap prompt is displayed in the top-right corner of the window.
        */
        prompt_parent_id?: string;

        /*
        This field changes the text of the title and messages in the One Tap prompt.
            signin	"Sign in with Google"
            signup	"Sign up with Google"
            use     "Use with Google"
         */
        context: "signin" | "signup" | "use";

        /*
        If you need to display One Tap in the parent domain and its subdomains, pass the parent domain to this field so that a single shared-state cookie is used.
        */
        state_cookie_domain?: string;

        /*
        The origins that are allowed to embed the intermediate iframe. One Tap runs in the intermediate iframe mode if this field is present.
         */
        allowed_parent_origin?: string | string[];

        /*
Overrides the default intermediate iframe behavior when users manually close One Tap by tapping on the 'X' button in the One Tap UI. The default behavior is to remove the intermediate iframe from the DOM immediately.

The intermediate_iframe_close_callback field takes effect only in intermediate iframe mode. And it has impact only to the intermediate iframe, instead of the One Tap iframe. The One Tap UI is removed before the callback is invoked.


 */
        intermediate_iframe_close_callback?: (e) => void;
        /*
        This field is a random string used by the ID token to prevent replay attacks
        */
        nonce?: string;
        /*
This field determines if the upgraded One Tap UX should be enabled on browsers that support Intelligent Tracking Prevention (ITP). The default value is false.
 */
        itp_support?: boolean;

        /*
        If your application knows in advance which user should be signed-in, it can provide a login hint to Google. When successful, account selection is skipped. Accepted values are: an email address or an ID token sub field value.
        */
        login_hint?: string;

        /*
        When a user has multiple accounts and should only sign-in with their Workspace account use this to provide a domain name hint to Google. When successful, user accounts displayed during account selection are limited to the provided domain. A wildcard value: * offers only Workspace accounts to the user and excludes consumer accounts (user@gmail.com) during account selection.
        */
        hd?: string;
        /*
        Allow the browser to control user sign-in prompts and mediate the sign-in flow between your website and Google. Defaults to false.
        */
        use_fedcm_for_prompt?: boolean;

        /*
        Enable button redirect flow that complies with Redirect URI validation rules.
        */
        enable_redirect_uri_validation?: boolean;
    } & (
        | {
              /*
            Use this field to set the UX flow used by the Sign In With Google button. The default value is popup.
            Performs sign-in UX flow in a pop-up window.
             */
              ux_mode: "popup";
              scope?: string; //profile email openid
          }
        | {
              /*
            Use this field to set the UX flow used by the Sign In With Google button. The default value is popup.
            Performs sign-in UX flow by a full page redirection.
             */
              ux_mode: "redirect";
              /*
           This attribute is the URI of your login endpoint.
           The value must exactly match one of the authorized redirect URIs for the OAuth 2.0 client, which you configured in the Google Cloud console and must conform to Redirect URI validation rules.
           This attribute may be omitted if the current page is your login page, in which case the credential is posted to this page by default.
          */
              login_uri: URL | string;

              scope?: string; //profile email openid
          }
    );
    customize?: {
        class: "g_id_signin";
        type: "standard";
        size: "large";
        theme: "outline";
        text: "sign_in_with";
        shape: "pill";
        logo_alignment: "left";
    };
};

const defaultOptions: IdProviderOptions<"google"> = {
    name: "google",
    options: {
        client_id: "",
        attributes: {
            context: "use",
            ux_mode: "popup",
            auto_select: true,
            itp_support: true,
            scope: "profile email openid",
        },
        customize: {
            class: "g_id_signin",
            type: "standard",
            size: "large",
            theme: "outline",
            text: "sign_in_with",
            shape: "pill",
            logo_alignment: "left",
        },
    } as GoogleIdProviderOptions,
};
const createOptions = (options: GoogleIdProviderOptions & { on_success?: (instance: any, value: any) => void; on_error?: (instance: any, error: any) => void }) => {
    const opts = { ...options } as IdProviderOptions<"google">;
    delete options.on_success;
    delete options.on_error;
    return {
        name: "google",
        on_error: opts.on_error,
        on_success: opts.on_success,
        options: {
            ...defaultOptions.options,
            ...options,
        } as GoogleIdProviderOptions,
    } as IdProviderOptions<"google">;
};
async function initGoogleAuth(doc: Document, locale: string, platformId: any) {
    locale = (locale ?? isPlatformBrowser(platformId)) ? navigator.language : null;
    await loadScript(doc, `https://accounts.google.com/gsi/client?${locale ? "hl=" + locale : ""}`);
}
/**
 * Creates an authentication provider that uses Google as an identity provider.
 *
 * @param options - Configuration options for the Google identity provider.
 * @param options.clientId - The client ID for the Google application.
 * @param options.attributes - Additional attributes for the Google sign-in.
 * @param options.customize - Customization options for the Google sign-in button.
 * @param options.on_success - The callback function to be executed on successful login.
 * @param options.on_error - The callback function to be executed on login error.
 * @returns An AuthProvider object configured with the specified options.
 */
export function withGoogleAuth(
    options: GoogleIdProviderOptions & { on_success?: (instance: any, value: any) => void; on_error?: (instance: any, error: any) => void },
): (Provider | EnvironmentProviders)[] {
    const opts = createOptions(options);
    return [
        // provideAppInitializer(initGoogleAuth),
        { provide: GOOGLE_ID_PROVIDER_OPTIONS, useValue: opts },
        {
            provide: AUTH_IDPs,
            multi: true,
            useFactory: () => new GoogleIdProviderService(),
        },
    ];
}
