import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SignUpComponent } from './signup/signup.component';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { VerifyComponent } from './verify/verify.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';


export const loginRoute = { path: 'login', component: LoginComponent }

export const signupRoute = { path: 'signup', component: SignUpComponent }
export const forgotPasswordRoute = { path: 'forgot-password', component: ForgotPasswordComponent }
export const resetPasswordRoute = { path: 'reset-password', component: ResetPasswordComponent }
export const verifyRoute = { path: 'verify/:name', component: VerifyComponent }
export const verifyEmailRoute = { path: 'verify/email', component: VerifyComponent }
export const verifyPhoneRoute = { path: 'verify/phone', component: VerifyComponent }


export const membershipRoutes: Routes = [
   loginRoute, signupRoute, forgotPasswordRoute, resetPasswordRoute, verifyRoute, verifyEmailRoute, verifyPhoneRoute
];

@NgModule({
  imports: [RouterModule.forChild(membershipRoutes)],
  exports: [RouterModule]
})
export class MembershipRoutingModule { }
