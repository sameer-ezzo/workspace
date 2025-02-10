import { NgModule, ModuleWithProviders, Provider, InjectionToken, makeEnvironmentProviders, EnvironmentProviders } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthOptions } from "./auth-options";
import { authProviders } from "./auth.provider";

const _options = new AuthOptions();

export const convertToProvider = (token: InjectionToken<string>, option: string | Provider) => {
    if (typeof option === "string") return { provide: token, useValue: option };
    return option;
};

// @NgModule({
//     imports: [CommonModule],
//     providers: [...authProviders(_options)],
// })
// export class AuthModule {
//     // constructor(@Optional() @SkipSelf() parentModule: AuthModule) {
//     //     if (parentModule) {
//     //         throw new Error('AuthModule is already loaded. Import it in the AppModule only');
//     //     }
//     // }

//     public static forRoot(baseUrl: string, options?: AuthOptions): ModuleWithProviders<AuthModule> {
//         options = { ..._options, ...options, base_url: baseUrl };

//         return {
//             ngModule: AuthModule,
//             providers: [...authProviders(options)],
//         };
//     }
// }
