import { ActionDescriptor } from "@upupa/common";
import { Type } from "@angular/core";


export type SideBarItem = ActionDescriptor & {
    link: string;
    queryParams?: any;
    href?: string;
    target?: string;
    external?: boolean;
    expanded?: boolean;

    component?: Type<any>
    viewModel?: any
};

export type SideBarGroup = { name: string, text: string, items: SideBarItem[] };
export type SideBarViewModel = (SideBarGroup | SideBarItem)[]