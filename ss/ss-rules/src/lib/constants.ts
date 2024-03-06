import { Type } from "@nestjs/common"

export const AUTHORIZE_PERMISSIONS = '__PERMISSIONS__'
export const CONTROLLER_PREFIX = '__TARGET_CONTROLLER__'

export const PermissionsSource = new Map<any, {permissions:any, controller?: Type<unknown> }>()