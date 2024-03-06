import { InjectionToken } from '@angular/core';
import { UserRole } from './user-role'

export const APP_ADMIN_ROLES_TOKEN = new InjectionToken<UserRole[]>('app default admin roles');
