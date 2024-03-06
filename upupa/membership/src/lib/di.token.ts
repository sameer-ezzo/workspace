import { InjectionToken } from "@angular/core";
import { MembershipForgotPasswordOptions, MembershipLoginOptions, MembershipOptions, MembershipSignupOptions, MembershipVerifyOptions, PageNavigationLink } from "./types";

export const SIGNUP_OPTIONS = new InjectionToken<MembershipSignupOptions>('signupoptions')

export const SIGNUP_LINKS = new InjectionToken<PageNavigationLink[]>('signup_links')
export const LOG_IN_OPTIONS = new InjectionToken<MembershipLoginOptions>('log_in_options');
export const IdPs_OPTIONS = new InjectionToken<Record<string, any>>('idps_options');
export const FORGOT_PASSWORD_OPTIONS = new InjectionToken<MembershipForgotPasswordOptions>('forgotpasswordoptions');
export const VERIFY_OPTIONS = new InjectionToken<MembershipVerifyOptions>('verifyoptions');
export const MEMBERSHIP_OPTIONS = new InjectionToken<MembershipOptions>('membershipoptions');



export const SIGNUP_LINKS_TOKEN = new InjectionToken<PageNavigationLink[]>('signup_links_token')
export const SIGNUP_ON_SUCCESS_TOKEN = new InjectionToken<(...args: []) => void>('signup_on_success_token')
export const SIGNUP_ON_FAILED_TOKEN = new InjectionToken<(...args: []) => void>('signup_on_failed_token')
export const SIGNUP_INITIAL_VALUE_FACTORY_TOKEN = new InjectionToken<() => Record<string, unknown>>('signup_initial_value_factory_token')
export const SIGNUP_EXTERNAL_LINKS_TOKEN = new InjectionToken<PageNavigationLink[]>('signup_external_links_token')

export const LOG_IN_LINKS_TOKEN = new InjectionToken<PageNavigationLink[]>('log_in_links_token')
export const LOG_IN_ON_SUCCESS_TOKEN = new InjectionToken<(...args: []) => void>('log_in_on_success_token')
export const LOG_IN_ON_FAILED_TOKEN = new InjectionToken<(...args: []) => void>('log_in_on_failed_token')
export const LOG_IN_INITIAL_VALUE_FACTORY_TOKEN = new InjectionToken<() => Record<string, unknown>>('log_in_initial_value_factory_token')
export const LOG_IN_EXTERNAL_LINKS_TOKEN = new InjectionToken<PageNavigationLink[]>('log_in_external_links_token')

export const FORGOT_PASSWORD_ON_SUCCESS_TOKEN = new InjectionToken<(...args: []) => void>('forgot_password_on_success_token')
export const FORGOT_PASSWORD_ON_FAILED_TOKEN = new InjectionToken<(...args: []) => void>('forgot_password_on_failed_token')
export const FORGOT_PASSWORD_EXTERNAL_LINKS_TOKEN = new InjectionToken<PageNavigationLink[]>('forgot_password_external_links_token')
export const FORGOT_PASSWORD_LINKS_TOKEN = new InjectionToken<PageNavigationLink[]>('forgot_password_links_token')
export const FORGOT_PASSWORD_INITIAL_VALUE_FACTORY_TOKEN = new InjectionToken<() => Record<string, unknown>>('forgot_password_initial_value_factory_token')

export const VERIFY_ON_FAILED_TOKEN = new InjectionToken<() => Record<string, unknown>>('verify_on_failed_token')
export const VERIFY_ON_SUCCESS_TOKEN = new InjectionToken<(...args: []) => void>('verify_on_success_token')
export const VERIFY_INITIAL_VALUE_FACTORY_TOKEN = new InjectionToken<(...args: []) => void>('verify_initial_value_factory_token')
export const VERIFY_EXTERNAL_LINKS_TOKEN = new InjectionToken<PageNavigationLink[]>('verify_external_links_token')
export const VERIFY_LINKS_TOKEN = new InjectionToken<PageNavigationLink[]>('verify_links_token')
