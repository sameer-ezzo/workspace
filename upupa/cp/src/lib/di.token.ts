import { InjectionToken } from "@angular/core";
import { SideBarViewModel } from "./cp-layout/side-bar-group-item";
import { Observable } from "rxjs";

export const SCAFFOLDING_SCHEME = new InjectionToken<any>('scaffolding scheme');
export const CP_OPTIONS = new InjectionToken<any>('cp options');
export const USER_PICTURE_RESOLVER = new InjectionToken<any>('user picture resolver');

export const CP_SIDE_BAR_ITEMS = new InjectionToken<SideBarViewModel | Promise<SideBarViewModel> | Observable<SideBarViewModel>>('Cp Side Bar Items');
