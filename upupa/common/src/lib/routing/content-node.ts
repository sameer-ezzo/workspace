import { Type, ComponentRef, TemplateRef } from "@angular/core";
import { DynamicComponent } from "../dynamic-component";


export type ContentNode<C = any> = string | Type<C> | DynamicComponent | ComponentRef<C> | TemplateRef<C>;
