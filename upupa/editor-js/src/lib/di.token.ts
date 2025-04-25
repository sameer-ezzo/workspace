import { InjectionToken } from "@angular/core";

export const EDITOR_JS_AI_PROMPT = new InjectionToken<(text: string) => Promise<any>>("EditorJS AI Prompt");
// export const HTML_EDITOR_UPLOAD_BASE = new InjectionToken<string>("HTML Editor Config Upload Base Url");
// export const HTML_EDITOR_CONFIG = new InjectionToken<string>("HTML Editor Config");
