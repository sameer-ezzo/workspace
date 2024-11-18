import { NgModule, ModuleWithProviders, Provider, InjectionToken } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TranslationModule } from "@upupa/language";

import { SignUpComponent } from "./signup/signup.component";
import { ForgotPasswordComponent } from "./forgot-password/forgot-password.component";
import { VerifyComponent } from "./verify/verify.component";

import { UtilsModule } from "@upupa/common";
import { ProfileComponent } from "./profile/profile.component";
import { LoginComponent } from "./login/login.component";
import { RouterModule } from "@angular/router";
import { ChangeAvatarComponent } from "./change-avatar/change-avatar.component";
import { ChangePhoneComponent } from "./change-phone/change-phone.component";
import { ChangeEmailComponent } from "./change-email/change-email.component";
import { MatMenuModule } from "@angular/material/menu";
import { MembershipRoutingModule } from "./membership-routing.module";
import { DynamicFormModule } from "@upupa/dynamic-form";
import {
    FORGOT_PASSWORD_EXTERNAL_LINKS_TOKEN,
    FORGOT_PASSWORD_INITIAL_VALUE_FACTORY_TOKEN,
    FORGOT_PASSWORD_LINKS_TOKEN,
    FORGOT_PASSWORD_ON_FAILED_TOKEN,
    FORGOT_PASSWORD_ON_SUCCESS_TOKEN,
    FORGOT_PASSWORD_OPTIONS,
    IdPs_OPTIONS,
    LOG_IN_EXTERNAL_LINKS_TOKEN,
    LOG_IN_INITIAL_VALUE_FACTORY_TOKEN,
    LOG_IN_LINKS_TOKEN,
    LOG_IN_ON_FAILED_TOKEN,
    LOG_IN_ON_SUCCESS_TOKEN,
    LOG_IN_OPTIONS,
    MEMBERSHIP_OPTIONS,
    SIGNUP_EXTERNAL_LINKS_TOKEN,
    SIGNUP_INITIAL_VALUE_FACTORY_TOKEN,
    SIGNUP_LINKS_TOKEN,
    SIGNUP_ON_FAILED_TOKEN,
    SIGNUP_ON_SUCCESS_TOKEN,
    SIGNUP_OPTIONS,
    VERIFY_EXTERNAL_LINKS_TOKEN,
    VERIFY_INITIAL_VALUE_FACTORY_TOKEN,
    VERIFY_LINKS_TOKEN,
    VERIFY_ON_FAILED_TOKEN,
    VERIFY_ON_SUCCESS_TOKEN,
    VERIFY_OPTIONS,
} from "./di.token";
import { BaseMembershipFormOptions, MembershipForgotPasswordOptions, MembershipLoginOptions, MembershipOptions, MembershipSignupOptions, MembershipVerifyOptions } from "./types";
import { PageNavigationComponent } from "./page-navigation/page-navigation.component";
import { ChangeUserPropComponent } from "./change-user-prop/change-user-prop.component";
import { ResetPasswordComponent } from "./reset-password/reset-password.component";
import { LoginFormComponent } from "./login-form/login-form.component";
import { SignUpFormComponent } from "./signup-form/signup-form.component";
import { ForgotPasswordFormComponent } from "./forgot-password-form/forgot-password-form.component";
import { ResetPasswordFormComponent } from "./reset-password-form/reset-password-form.component";
import { IdpButtonDirective } from "./idp-button.directive";
import { DF_MATERIAL_THEME_INPUTS, DynamicFormMaterialThemeModule } from "@upupa/dynamic-form-material-theme";

const optionsProviders = <T extends BaseMembershipFormOptions>(form: "LOG_IN" | "SIGNUP" | "FORGOT_PASSWORD" | "VERIFY", options: T): Provider[] => {
    const providers = {
        LOG_IN: [
            { provide: LOG_IN_ON_SUCCESS_TOKEN, ...options.on_success },
            { provide: LOG_IN_ON_FAILED_TOKEN, ...options.on_failed },
            {
                provide: LOG_IN_INITIAL_VALUE_FACTORY_TOKEN,
                ...options.initial_value_factory,
            },
            { provide: LOG_IN_LINKS_TOKEN, ...options.links },
            { provide: LOG_IN_EXTERNAL_LINKS_TOKEN, ...options.external_links },
        ],
        SIGNUP: [
            { provide: SIGNUP_ON_SUCCESS_TOKEN, ...options.on_success },
            { provide: SIGNUP_ON_FAILED_TOKEN, ...options.on_failed },
            {
                provide: SIGNUP_INITIAL_VALUE_FACTORY_TOKEN,
                ...options.initial_value_factory,
            },
            { provide: SIGNUP_LINKS_TOKEN, ...options.links },
            { provide: SIGNUP_EXTERNAL_LINKS_TOKEN, ...options.external_links },
        ],
        FORGOT_PASSWORD: [
            {
                provide: FORGOT_PASSWORD_ON_SUCCESS_TOKEN,
                ...options.on_success,
            },
            { provide: FORGOT_PASSWORD_ON_FAILED_TOKEN, ...options.on_failed },
            {
                provide: FORGOT_PASSWORD_INITIAL_VALUE_FACTORY_TOKEN,
                ...options.initial_value_factory,
            },
            { provide: FORGOT_PASSWORD_LINKS_TOKEN, ...options.links },
            {
                provide: FORGOT_PASSWORD_EXTERNAL_LINKS_TOKEN,
                ...options.external_links,
            },
        ],
        VERIFY: [
            { provide: VERIFY_ON_SUCCESS_TOKEN, ...options.on_success },
            { provide: VERIFY_ON_FAILED_TOKEN, ...options.on_failed },
            {
                provide: VERIFY_INITIAL_VALUE_FACTORY_TOKEN,
                ...options.initial_value_factory,
            },
            { provide: VERIFY_LINKS_TOKEN, ...options.links },
            { provide: VERIFY_EXTERNAL_LINKS_TOKEN, ...options.external_links },
        ],
    };

    return providers[form];
};
const membershipOptionsProviders = (options: MembershipOptions): Provider[] => {
    const providers = [
        { provide: LOG_IN_OPTIONS, useValue: options.login },
        { provide: SIGNUP_OPTIONS, useValue: options.signup },
        { provide: VERIFY_OPTIONS, useValue: options.verify },
        { provide: FORGOT_PASSWORD_OPTIONS, useValue: options.forgotPassword },
        { provide: MEMBERSHIP_OPTIONS, useValue: options },
    ] as any[];

    if (options.login !== null) providers.push(...optionsProviders<MembershipLoginOptions>("LOG_IN", options.login));
    if (options.signup !== null) providers.push(...optionsProviders<MembershipSignupOptions>("SIGNUP", options.signup));
    if (options.verify !== null) providers.push(...optionsProviders<MembershipVerifyOptions>("VERIFY", options.verify));
    if (options.forgotPassword !== null) providers.push(...optionsProviders<MembershipForgotPasswordOptions>("FORGOT_PASSWORD", options.forgotPassword));
    if (options.idPs !== null) providers.push({ provide: IdPs_OPTIONS, useValue: options.idPs });

    return providers;
};

const _defaultMembershipOptions = new MembershipOptions();

const components = [
    IdpButtonDirective,
    SignUpComponent,
    SignUpFormComponent,
    ForgotPasswordComponent,
    ForgotPasswordFormComponent,
    ResetPasswordComponent,
    ResetPasswordFormComponent,
    VerifyComponent,
    ProfileComponent,
    LoginComponent,
    LoginFormComponent,
    ChangeAvatarComponent,
    ChangePhoneComponent,
    ChangeEmailComponent,
    PageNavigationComponent,
    ChangeUserPropComponent,
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        TranslationModule,
        MembershipRoutingModule,
        UtilsModule,
        DynamicFormModule,
    ],
    declarations: [...components],
    exports: [...components],
    providers: [...membershipOptionsProviders(_defaultMembershipOptions)],
})
export class MembershipModule {
    public static forRoot(options?: Partial<MembershipOptions>): ModuleWithProviders<MembershipModule> {
        const mergeOptions = (key: keyof MembershipOptions, options, defaults) => {
            return options?.[key] === null ? null : { ...defaults[key], ...options?.[key] };
        };

        const membershipOptions = { ..._defaultMembershipOptions };
        if (options) {
            membershipOptions.login = options.login === null ? null : mergeOptions("login", options, _defaultMembershipOptions);
            membershipOptions.signup = options.signup === null ? null : mergeOptions("signup", options, _defaultMembershipOptions);
            membershipOptions.verify = options.verify === null ? null : mergeOptions("verify", options, _defaultMembershipOptions);
            membershipOptions.forgotPassword = options.forgotPassword === null ? null : mergeOptions("forgotPassword", options, _defaultMembershipOptions);
            membershipOptions.idPs = options.idPs === null ? null : { ..._defaultMembershipOptions.idPs, ...options.idPs };
        }

        const _membershipOptionsProviders = membershipOptionsProviders(membershipOptions);

        return {
            ngModule: MembershipModule,
            providers: [..._membershipOptionsProviders],
        };
    }
}
