import { AuthProvider } from "../../auth.provider";
import { IdPName, IdPOptions, IdPsOptions } from "../types";
import { DynamicComponent } from "@upupa/common";
import { GoogleIdProviderComponent } from "./google-id-provider.component";

export type GoogleIDPOptions = {
    clientId: string;
    attributes?: {
        context: "signin";
        callback: "signin";
        nonce: "";
        auto_select: "true" | "false";
        itp_support: "true" | "false";
    } & (
        | {
              ux_mode: "popup";
              scope?: string; //profile email openid
          }
        | {
              ux_mode: "redirect";
              login_uri?: string;
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

const defaultOptions: IdPOptions<"google"> = {
    name: "google",
    options: {
        clientId: "",
        attributes: {
            context: "signin",
            ux_mode: "popup",
            callback: "signin",
            nonce: "",
            auto_select: "true",
            itp_support: "true",
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
    } as GoogleIDPOptions,
};
const createOptions = (options: IdPOptions<"google">): IdPOptions<"google"> => {
    return {
        ...defaultOptions,
        ...options,
        options: {
            attributes: {
                ...defaultOptions.options?.attributes,
                ...options.options?.attributes,
            },
            customize: {
                ...defaultOptions.options?.customize,
                ...options.options?.customize,
            },
        } as GoogleIDPOptions,
    } as IdPOptions<"google">;
};

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
export function withGoogleAuth(options: IdPOptions<"google">): AuthProvider {
    const opts = createOptions(options);
    const outputs = {};
    if (options.on_success) outputs["success"] = opts.on_success;
    if (options.on_error) outputs["error"] = opts.on_error;
    return {
        useValue: {
            name: "google",
            template: {
                component: GoogleIdProviderComponent,
                inputs: {
                    idp: {
                        options,
                    } as IdPsOptions<"google">,
                },
                outputs,
            } as DynamicComponent,
        },
    } as AuthProvider;
}
