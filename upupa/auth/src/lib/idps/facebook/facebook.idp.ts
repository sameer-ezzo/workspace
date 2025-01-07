import { AuthProvider } from "../../auth.provider";

export type FacebookIdProviderOptions = any;
export function withFacebookAuth(options: Partial<FacebookIdProviderOptions>): AuthProvider {
    return { useValue: { name: "facebook",  options } } as AuthProvider;
}
