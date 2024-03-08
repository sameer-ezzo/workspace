import { ActionDescriptor } from "@upupa/common";


export type SideBarItem = ActionDescriptor & {
    link: string;
    queryParams?: any;
    href?: string;
    target?: string;
    external?: boolean;
};

export type SideBarGroup = ActionDescriptor & {
    items: SideBarItem[];
};
