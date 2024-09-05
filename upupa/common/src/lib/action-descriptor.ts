import { Type } from '@angular/core';
import { MatBadgePosition, MatBadgeSize } from '@angular/material/badge';
import { ThemePalette } from '@angular/material/core';

export type ActionsDescriptor = ActionDescriptor[];
export type ActionEvent<T = any, C = any> = {
  action: ActionDescriptor;
  data: T[];
  context?: C;
};

export type ActionDescriptorBase = {
  /// <summary>
  /// The name of the action to be used in the UI
  /// </summary>
  name: string;
  meta?: any & { closeDialog: boolean };
};

/**
 * Represents the appearance properties of an action descriptor.
 *
 * @property {('button' | 'submit')?} type - The type of the action.
 * @property {string?} text - The text to be displayed on the action.
 * @property {string?} icon - The icon to be displayed on the action.
 * @property {string?} icon_url - The URL of the icon to be displayed on the action.
 *
 * @property {('primary' | 'accent' | 'warn' | string)?} color - The color of the action.
 * @property {string?} tooltip - The tooltip text for the action.
 * @property {('left' | 'right' | 'above' | 'below' | 'before' | 'after')?} tooltipPosition - The position of the tooltip.
 *
 * @property {boolean} disabled - Indicates if the action is disabled.
 *
 * @property {string?} matBadge - The badge text for the action.
 * @property {ThemePalette?} matBadgeColor - The color of the badge.
 * @property {MatBadgePosition?} matBadgePosition - The position of the badge.
 * @property {MatBadgeSize?} matBadgeSize - The size of the badge.
 * @property {('button' | 'raised' | 'flat' | 'stroked' | 'icon' | 'fab' | 'mini-fab')?} variant - The variant of the action.
 *
 * @property {boolean} bulk - Indicates if the action is a bulk action.
 * @property {boolean} menu - Indicates if the action is a menu action.
 * @property {boolean} header - Indicates if the action is a header action.
 */
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
  matBadgePosition?: MatBadgePosition;
  matBadgeSize?: MatBadgeSize;
  variant?:
    | 'button'
    | 'raised'
    | 'flat'
    | 'stroked'
    | 'icon'
    | 'fab'
    | 'mini-fab';

  bulk?: boolean;
  menu?: boolean;
  header?: boolean;
};

export type ActionDescriptor = ActionDescriptorBase &
  ActionDescriptorAppearance &
  (
    | {
        component: Type<any>;
        inputs: Record<string, any>;
      }
    | {
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
      }
  );
