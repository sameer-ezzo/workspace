import { Type, ComponentRef, TemplateRef } from "@angular/core";
import { DynamicComponent } from "../dynamic-component";


export type ContentNode = string | Type<any> | DynamicComponent | ComponentRef<any> | TemplateRef<any>;
