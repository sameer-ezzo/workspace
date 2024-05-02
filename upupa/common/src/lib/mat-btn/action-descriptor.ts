import { MatBadgePosition, MatBadgeSize } from "@angular/material/badge";
import { ThemePalette } from "@angular/material/core";

export type ActionsDescriptor = ActionDescriptor[];
export type ActionEvent<T = any> = { action: ActionDescriptor; data: T[]; };

export class ActionDescriptor {
    action: string;
    path?: string;

    type?: 'button' | 'submit' = 'button';
    text?: string;
    icon?: string;
    icon_url?: string;

    color?: 'primary' | 'accent' | 'warn' | string;
    tooltip?: string;
    tooltipPosition?: 'left' | 'right' | 'above' | 'below' | 'before' | 'after' = 'above';

    bulk?: boolean;
    position?: 'menu' | 'header' | 'footer' | 'bulk' | string;
    menu?: boolean;
    header?: boolean;

    disabled?: boolean; //per command
    active?: boolean;

    matBadge?: string;
    matBadgeColor?: ThemePalette;
    matBadgePosition?: MatBadgePosition
    matBadgeSize?: MatBadgeSize
    variant?: 'button' | 'raised' | 'flat' | 'stroked' | 'icon' | 'fab' | 'mini-fab';

    handler?: (event: ActionEvent) => Promise<any>;

    meta?: any & { closeDialog: boolean };
    static _bulk(a: ActionDescriptor) { return a.position === 'bulk' || a.bulk; }
    static _header(a: ActionDescriptor) { return a.position === 'header' || a.header; }
    static _menu(a: ActionDescriptor) { return a.position === 'menu' || a.menu; }
    static _button(a: ActionDescriptor) { return a.bulk !== true && a.menu !== true && a.header !== true && !a.position; }
};