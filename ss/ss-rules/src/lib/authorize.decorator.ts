import { applyDecorators, UseInterceptors } from "@nestjs/common"
import { AccessType, SimplePermissionBase } from "@noah-ark/common"
import { _controllerPrefix } from "@ss/common"
import { AuthorizeInterceptor } from "./authorize.interceptor"
import { AUTHORIZE_PERMISSIONS, PermissionsSource } from "./constants"




export function Authorize(options?: SimplePermissionBase & { access?: AccessType }) {

    const decorator = (...args: [object, string, PropertyDescriptor] | [object]) => {
        const target = args[0] as any

        const permission = { ...{ access: 'grant', by: 'user', builtIn: true }, ...options }



        if (args.length === 1) {
            const ps = Reflect.getMetadata(AUTHORIZE_PERMISSIONS, target) ?? []
            ps.push(permission)
            Reflect.defineMetadata(AUTHORIZE_PERMISSIONS, { permissions: ps }, target)
            PermissionsSource.set(target, ps)
        }
        else {
            const _propertyKey = args[1] as string
            const descriptor = args[2] as PropertyDescriptor

            const ps = Reflect.getMetadata(AUTHORIZE_PERMISSIONS, descriptor.value) ?? []
            ps.push(permission)
            Reflect.defineMetadata(AUTHORIZE_PERMISSIONS, ps, descriptor.value)


            PermissionsSource.set(descriptor.value, { permissions: ps, controller: target })
        }
    }


    return applyDecorators(...[decorator, UseInterceptors(AuthorizeInterceptor)])
}


// export function AuthorizeMethod(options?: SimplePermissionBase & { access?: AccessType }): MethodDecorator {

//     const decorator = (target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
//         const permission = (!options ?
//             { access: 'grant', by: 'user', builtIn: true } :
//             { ...options, access: options.access ?? 'grant', builtIn: true }
//         )
//         const ps = Reflect.getMetadata(AUTHORIZE_PERMISSIONS, descriptor.value) ?? []
//         ps.push(permission)
//         Reflect.defineMetadata(AUTHORIZE_PERMISSIONS, ps, descriptor.value)
//         PermissionsSource.set(descriptor.value, ps)
//     }

//     return applyDecorators(...[decorator, UseInterceptors(AuthorizeInterceptor)])
// }

// export function AuthorizeController(options?: SimplePermissionBase & { access?: AccessType }): ClassDecorator {

//     const decorator = (target: any, _propertyKey: string, descriptor: PropertyDescriptor) => {
//         const permission = (!options ?
//             { access: 'grant', by: 'user', builtIn: true } :
//             { ...options, access: options.access ?? 'grant', builtIn: true }
//         )
//         const ps = Reflect.getMetadata(AUTHORIZE_PERMISSIONS, descriptor.value) ?? []
//         ps.push(permission)
//         Reflect.defineMetadata(AUTHORIZE_PERMISSIONS, ps, descriptor.value)
//         PermissionsSource.set(descriptor.value, ps)
//     }

//     return applyDecorators(...[decorator, UseInterceptors(AuthorizeInterceptor)])
// }