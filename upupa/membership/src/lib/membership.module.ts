import { makeEnvironmentProviders } from "@angular/core";

import { FORGOT_PASSWORD_OPTIONS, LOG_IN_OPTIONS, RESET_PASSWORD_OPTIONS, SIGNUP_OPTIONS } from "./di.token";
import { MembershipForgotPasswordOptions, MembershipLoginOptions, MembershipOptions, MembershipResetPasswordOptions, MembershipSignupOptions } from "./types";

// const optionsProviders = <T extends BaseMembershipFormOptions>(form: "LOG_IN" | "SIGNUP" | "FORGOT_PASSWORD" | "VERIFY", options: T): Provider[] => {
//     const providers = {
//         LOG_IN: [
//             { provide: LOG_IN_ON_SUCCESS_TOKEN, ...options.on_success },
//             { provide: LOG_IN_ON_FAILED_TOKEN, ...options.on_failed },
//             {
//                 provide: LOG_IN_INITIAL_VALUE_FACTORY_TOKEN,
//                 ...options.initial_value_factory,
//             },
//             { provide: LOG_IN_LINKS_TOKEN, ...options.links },
//             { provide: LOG_IN_EXTERNAL_LINKS_TOKEN, ...options.external_links },
//         ],
//         SIGNUP: [
//             { provide: SIGNUP_ON_SUCCESS_TOKEN, ...options.on_success },
//             { provide: SIGNUP_ON_FAILED_TOKEN, ...options.on_failed },
//             {
//                 provide: SIGNUP_INITIAL_VALUE_FACTORY_TOKEN,
//                 ...options.initial_value_factory,
//             },
//             { provide: SIGNUP_LINKS_TOKEN, ...options.links },
//             { provide: SIGNUP_EXTERNAL_LINKS_TOKEN, ...options.external_links },
//         ],
//         FORGOT_PASSWORD: [
//             {
//                 provide: FORGOT_PASSWORD_ON_SUCCESS_TOKEN,
//                 ...options.on_success,
//             },
//             { provide: FORGOT_PASSWORD_ON_FAILED_TOKEN, ...options.on_failed },
//             {
//                 provide: FORGOT_PASSWORD_INITIAL_VALUE_FACTORY_TOKEN,
//                 ...options.initial_value_factory,
//             },
//             { provide: FORGOT_PASSWORD_LINKS_TOKEN, ...options.links },
//             {
//                 provide: FORGOT_PASSWORD_EXTERNAL_LINKS_TOKEN,
//                 ...options.external_links,
//             },
//         ],
//         VERIFY: [
//             { provide: VERIFY_ON_SUCCESS_TOKEN, ...options.on_success },
//             { provide: VERIFY_ON_FAILED_TOKEN, ...options.on_failed },
//             {
//                 provide: VERIFY_INITIAL_VALUE_FACTORY_TOKEN,
//                 ...options.initial_value_factory,
//             },
//             { provide: VERIFY_LINKS_TOKEN, ...options.links },
//             { provide: VERIFY_EXTERNAL_LINKS_TOKEN, ...options.external_links },
//         ],
//     };

//     return providers[form];
// };
// const membershipOptionsProviders = (options: MembershipOptions): Provider[] => {
//     const providers = [
//         { provide: LOG_IN_OPTIONS, useValue: options.login },
//         { provide: SIGNUP_OPTIONS, useValue: options.signup },
//         { provide: VERIFY_OPTIONS, useValue: options.verify },
//         { provide: FORGOT_PASSWORD_OPTIONS, useValue: options.forgotPassword },
//         { provide: MEMBERSHIP_OPTIONS, useValue: options },
//     ] as any[];

//     if (options.login !== null) providers.push(...optionsProviders<MembershipLoginOptions>("LOG_IN", options.login));
//     if (options.signup !== null) providers.push(...optionsProviders<MembershipSignupOptions>("SIGNUP", options.signup));
//     if (options.verify !== null) providers.push(...optionsProviders<MembershipVerifyOptions>("VERIFY", options.verify));
//     if (options.forgotPassword !== null) providers.push(...optionsProviders<MembershipForgotPasswordOptions>("FORGOT_PASSWORD", options.forgotPassword));
//     if (options.idPs !== null) providers.push({ provide: IdPs_OPTIONS, useValue: options.idPs });

//     return providers;
// };

const _defaultMembershipOptions = new MembershipOptions();

const components = [];

// @NgModule({
//     imports: [
//         CommonModule,
//         FormsModule,
//         ReactiveFormsModule,
//         RouterModule,
//         MatInputModule,
//         MatIconModule,
//         MatButtonModule,
//         MatMenuModule,
//         MembershipRoutingModule,
//         UtilsModule,
//         DynamicFormModule,
//         IdpButtonDirective,
//         SignUpComponent,
//         SignUpFormComponent,
//         ForgotPasswordComponent,
//         ForgotPasswordFormComponent,
//         ResetPasswordComponent,
//         ResetPasswordFormComponent,
//         VerifyComponent,
//         ProfileComponent,
//         LoginComponent,
//         LoginFormComponent,
//         ChangeAvatarComponent,
//         ChangePhoneComponent,
//         ChangeEmailComponent,
//         PageNavigationComponent,
//         ChangeUserPropComponent,
//     ],
//     declarations: [...components],
//     exports: [...components],
//     providers: [...membershipOptionsProviders(_defaultMembershipOptions)],
// })
// export class MembershipModule {
//     public static forRoot(options?: Partial<MembershipOptions>): ModuleWithProviders<MembershipModule> {
//         const mergeOptions = (key: keyof MembershipOptions, options, defaults) => {
//             return options?.[key] === null ? null : { ...defaults[key], ...options?.[key] };
//         };

//         const membershipOptions = { ..._defaultMembershipOptions };
//         if (options) {
//             membershipOptions.login = options.login === null ? null : mergeOptions("login", options, _defaultMembershipOptions);
//             membershipOptions.signup = options.signup === null ? null : mergeOptions("signup", options, _defaultMembershipOptions);
//             membershipOptions.verify = options.verify === null ? null : mergeOptions("verify", options, _defaultMembershipOptions);
//             membershipOptions.forgotPassword = options.forgotPassword === null ? null : mergeOptions("forgotPassword", options, _defaultMembershipOptions);
//             membershipOptions.idPs = options.idPs === null ? null : { ..._defaultMembershipOptions.idPs, ...options.idPs };
//         }

//         const _membershipOptionsProviders = membershipOptionsProviders(membershipOptions);

//         return {
//             ngModule: MembershipModule,
//             providers: [..._membershipOptionsProviders],
//         };
//     }
// }

/**
 * Provides the login options for the login component.
 *
 * @param options - Partial login options to override the default settings.
 * @returns An array of providers for the login options.
 */
export function provideLogin(options?: Partial<MembershipLoginOptions>) {
    const opts = { ..._defaultMembershipOptions.login, ...options };
    return makeEnvironmentProviders([{ provide: LOG_IN_OPTIONS, useValue: opts }]);
}
/**
 * Provides the sign up options for the sign up component.
 *
 * @param options - Partial sign up options to override the default settings.
 * @returns An array of providers for the sign up options.
 */
export function provideSignup(options?: Partial<MembershipSignupOptions>) {
    const opts = { ..._defaultMembershipOptions.signup, ...options };
    return makeEnvironmentProviders([{ provide: SIGNUP_OPTIONS, useValue: opts }]);
}
/**
 * Provides the forgot password options for the forgot password component.
 *
 * @param options - Partial forgot password options to override the default settings.
 * @returns An array of providers for the forgot password options.
 */
export function provideForgotPassword(options?: Partial<MembershipForgotPasswordOptions>) {
    const opts = { ..._defaultMembershipOptions.forgotPassword, ...options };
    return makeEnvironmentProviders([{ provide: FORGOT_PASSWORD_OPTIONS, useValue: opts }]);
}

/**
 * Provides the reset password options for the reset password component.
 *
 * @param options - Partial reset password options to override the default settings.
 * @returns An array of providers for the reset password options.
 */
export function provideResetPassword(options?: Partial<MembershipResetPasswordOptions>) {
    const opts = { ..._defaultMembershipOptions.resetPassword, ...options };
    return makeEnvironmentProviders([{ provide: RESET_PASSWORD_OPTIONS, useValue: opts }]);
}
