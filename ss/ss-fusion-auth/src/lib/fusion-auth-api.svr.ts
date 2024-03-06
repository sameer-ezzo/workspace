import { AuthException, AuthExceptions } from './auth-exception';
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AuthOptions } from './auth-options';
import { logger } from "./logger";
import { RegistrationRequest, RegistrationResponse, User, UserRegistration } from '@fusionauth/typescript-client';
import ClientResponse from '@fusionauth/typescript-client/build/src/ClientResponse';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export type SignupResponse = {
    token: string,
    tokenExpirationInstant: number,
    usernameStatus: string,
    username: string,
    verified: boolean,
    verifiedInstant: number,
    user: any,
    id: string,
}

export type SignInPayload = {
    loginId: string;
    password: string;
    device?: {
        description: string;
        lastAccessedAddress: string;
        name: string;
        type: string;
    };
    appId?: string;
    twoFactorTrustId?: string;
};

export type SignInResponse = {
    refreshToken: string;
    refreshTokenId: string;
    state?: any;
    token: string;
    tokenExpirationInstant: number;
    user: any;
    usernameStatus: string;
    username: string;
    verified: boolean;
    verifiedInstant: number;
    access_token: string;
    refresh_token: string;
};


