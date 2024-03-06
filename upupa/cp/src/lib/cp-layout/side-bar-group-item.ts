

type SideBarItemBase = {
    roles?: string[];
    active?: boolean;
    name: string;
    icon?: string;
    icon_url?: string;
    text: string;
}
export type SideBarItem = SideBarItemBase & {
    link: string;
    queryParams?: any;

    href?: string;
    target?: string;
    external?: boolean;

};

export type SideBarGroup = SideBarItemBase & {
    items: SideBarItem[];
};
