import { Type } from "@angular/core";
import { MatBadgePosition, MatBadgeSize } from "@angular/material/badge";
import { ThemePalette } from "@angular/material/core";

export type ActionsDescriptor = ActionDescriptor[];
export type ActionEvent<T = any> = { action: ActionDescriptor; data: T[]; context?: any };


export type ActionDescriptorBase = {

    /// <summary>
    /// The name of the action to be used in the UI
    /// </summary>
    name: string;
    meta?: any & { closeDialog: boolean };
}

export type ActionDescriptorAppearance = {
    type?: 'button' | 'submit';
    text?: string;
    icon?: string;
    icon_url?: string;

    color?: 'primary' | 'accent' | 'warn' | string;
    tooltip?: string;
    tooltipPosition?: 'left' | 'right' | 'above' | 'below' | 'before' | 'after';

    disabled?: boolean; //per command


    matBadge?: string;
    matBadgeColor?: ThemePalette;
    matBadgePosition?: MatBadgePosition
    matBadgeSize?: MatBadgeSize
    variant?: 'button' | 'raised' | 'flat' | 'stroked' | 'icon' | 'fab' | 'mini-fab';

    bulk?: boolean;
    menu?: boolean;
    header?: boolean;

}

export type ActionDescriptor = ActionDescriptorBase & ActionDescriptorAppearance & (

    {
        component: Type<any>
        inputs: Record<string, any>
    }
    |
    {



        /// <summary>
        /// The path of the action to be used in authorization
        /// </summary>
        path?: string;
        /// <summary>
        /// The action name to be used in authorization
        /// </summary>
        action?: string;


        // static _bulk(a: ActionDescriptor) { return a.position === 'bulk' || a.bulk; }
        // static _header(a: ActionDescriptor) { return a.position === 'header' || a.header; }
        // static _menu(a: ActionDescriptor) { return a.position === 'menu' || a.menu; }
        // static _button(a: ActionDescriptor) { return a.bulk !== true && a.menu !== true && a.header !== true && !a.position; }
    });