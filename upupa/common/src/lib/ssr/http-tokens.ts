import { InjectionToken } from "@angular/core";
import type { Request, Response } from "express";

//note that these tokens will not work with ng serve ... as mentioned in github issues

export const REQUEST: InjectionToken<Request> = new InjectionToken<Request>("REQUEST");
export const RESPONSE: InjectionToken<Response> = new InjectionToken<Response>("RESPONSE");
