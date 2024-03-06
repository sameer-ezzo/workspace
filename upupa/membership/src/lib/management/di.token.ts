import { InjectionToken } from "@angular/core";
import { UsersManagementOptions } from "./types";

export const USERS_MANAGEMENT_OPTIONS = new InjectionToken<UsersManagementOptions>('UsersOptions');
