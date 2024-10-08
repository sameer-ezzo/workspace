import { InjectionToken } from "@angular/core";
import { type Request, type Response } from "express";

//note that these tokens will not work with ng serve ... as mentioned in github issues

export const REQUEST = new InjectionToken<Request>("REQUEST");
export const RESPONSE = new InjectionToken<Response>("RESPONSE");
