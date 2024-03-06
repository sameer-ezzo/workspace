import { Request as HttpRequest, Response as HttpResponse } from "express";

export type Request = Partial<HttpRequest> & { user?: any };
export type Response = Partial<HttpResponse>;
