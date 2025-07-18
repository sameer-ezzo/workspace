import { inject } from "@angular/core";
import { HttpRequest, HttpEvent, HttpHandlerFn } from "@angular/common/http";
import { AuthService } from "./auth.service";
import { Observable, Subscription } from "rxjs";

const REFRESH_IDENTITY_BEFORE = 60000;
let refreshingIdentity: Promise<any>;
function tryRefreshToken(auth: AuthService, req: Request | HttpRequest<unknown>): Promise<any> {
    if (refreshingIdentity) return refreshingIdentity;
    const user = auth.user ?? auth.fromCookies(req);

    if (user) {
        const now = Date.now();
        const exp = new Date(user.exp * 1000).getTime();
        if (now > exp || exp - now < 60000) return (refreshingIdentity = auth.refresh());
    }
    // if (isServer) return Promise.resolve(); // no need to refresh on server side
    else if (auth.get_refresh_token()) return (refreshingIdentity = auth.refresh());
    return Promise.resolve();
}
export function AuthInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    // in milliseconds
    const auth = inject(AuthService);
    return new Observable<HttpEvent<any>>((observer) => {
        let subscription: Subscription;

        tryRefreshToken(auth, req)
            .then(() => {
                refreshingIdentity = undefined; //free up

                const token = auth.get_token();

                if (token) {
                    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
                }

                subscription = next(req).subscribe(observer);
            })
            .catch((error) => {
                observer.error(error);
            });

        return () => {
            if (subscription) subscription.unsubscribe();
        }; //unsubscribe
    });
}
