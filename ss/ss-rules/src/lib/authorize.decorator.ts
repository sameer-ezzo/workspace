import { applyDecorators, UseInterceptors } from "@nestjs/common";
import { AccessType, SimplePermission } from "@noah-ark/common";
import { _controllerPrefix } from "@ss/common";
import { AuthorizeInterceptor } from "./authorize.interceptor";
import { AUTHORIZE_PERMISSIONS, PermissionsSource } from "./constants";

export function Authorize(options?: Partial<SimplePermission>) {
    const decorator = (...args: [object, string, PropertyDescriptor] | [object]) => {
        const target = args[0] as any;
        const permission = { ...{ access: "grant", by: "user", builtIn: true }, ...options };

        if (args.length === 1) {

            const ps = Reflect.getMetadata(AUTHORIZE_PERMISSIONS, target) ?? [];
            ps.push(permission);
            Reflect.defineMetadata(AUTHORIZE_PERMISSIONS, { permissions: ps }, target);
            PermissionsSource.set(target, ps);

            console.log("Authorize", `${target.constructor.name}`, ps);
        } else {
            const property = target;
            const propertyName = args[1] as string;
            const descriptor = args[2] as PropertyDescriptor;

            const ps = Reflect.getMetadata(AUTHORIZE_PERMISSIONS, descriptor.value) ?? [];
            ps.push(permission);
            Reflect.defineMetadata(AUTHORIZE_PERMISSIONS, ps, descriptor.value);

            PermissionsSource.set(descriptor.value, { permissions: ps, controller: target });

            console.log("Authorize", `${property.constructor.name}:${propertyName}`, ps);
        }
    };

    return applyDecorators(...[decorator, UseInterceptors(AuthorizeInterceptor)]);
}

export function AuthorizeRole(role: string) {
    return Authorize({ by: "role", value: role });
}

export function AuthorizeAnonymous() {
    return Authorize({ by: "anonymous" });
}

export function AuthorizePublic() {
    return Authorize({ by: "anonymous" });
}

export function AuthorizeClaim(claim: { claimFieldPath: string; claimValue: string; operator?: string }) {
    return Authorize({ by: "claim", value: claim });
}

export function AuthorizeUser(email: string) {
    return Authorize({ by: "email", value: email });
}

export function AuthorizeEmailVerified() {
    return Authorize({ by: "emv" });
}
export function AuthorizePhone(phone: string) {
    return Authorize({ by: "phone", value: phone });
}

export function AuthorizePhoneVerified(email: string) {
    return Authorize({ by: "phv" });
}

export function AuthorizeLoggedIn() {
    return Authorize({ by: "user" });
}
