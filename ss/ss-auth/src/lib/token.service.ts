import { Injectable } from "@nestjs/common";
import * as jose from "jose";

export type SignOptions = {
    issuer?: string;
    expiresIn: string | number;
    audience?: string;
    subject?: string;
};

export type TokenBase = { t: string } & Record<string, any>;

@Injectable()
export class TokenService {
    async verifyToken(secret: Uint8Array, token: string): Promise<TokenBase | undefined> {
        try {
            const result = await jose.jwtVerify(token, secret);
            return result.payload as TokenBase;
        } catch {
            return undefined;
        }
    }

    async sign(secret: Uint8Array, defaultIssuer: string | null | undefined, payload: TokenBase, options: SignOptions): Promise<string> {
        const jwt = await new jose.SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(options.expiresIn);

        if (defaultIssuer) jwt.setIssuer(defaultIssuer);
        if (options.issuer) jwt.setIssuer(options.issuer);
        if (options.audience) jwt.setAudience(options.audience);
        if (options.subject) jwt.setSubject(options.subject);
        if (options.expiresIn) jwt.setExpirationTime(options.expiresIn);

        return jwt.sign(secret);
    }

    issueGenericToken(secret: Uint8Array, defaultIssuer: string | null | undefined, payload: TokenBase, expiresIn = "7 days"): Promise<string> {
        return this.sign(secret, defaultIssuer, payload, { expiresIn });
    }
}
