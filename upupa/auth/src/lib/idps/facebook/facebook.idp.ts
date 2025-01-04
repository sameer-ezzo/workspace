import { AuthProvider } from "../../auth.provider";

export type FacebookIDPOptions = any;
export function withFacebookAuth(options: Partial<FacebookIDPOptions>): AuthProvider {
    return { useValue: { name: "facebook",  options } } as AuthProvider;
}
