import { inject } from "@angular/core";
import { HttpRequest, HttpEvent, HttpHandlerFn } from "@angular/common/http";
import { AuthSessionAccessor } from "./auth-session.accessor";
import { AuthTokenAccessor } from "./auth-token.accessor";
import { AuthUserAccessor } from "./auth-user.accessor";
import { Observable, Subscription } from "rxjs";

const REFRESH_IDENTITY_BEFORE = 60000;
let refreshingIdentity: Promise<any>;
function tryRefreshToken(authUser: AuthUserAccessor, authToken: AuthTokenAccessor, authSession: AuthSessionAccessor, req: Request | HttpRequest<unknown>): Promise<any> {
    if (refreshingIdentity) return refreshingIdentity;
    const user = authUser.user ?? authUser.fromRequest(req);

    if (user) {
        const now = Date.now();
        const exp = new Date(user.exp * 1000).getTime();
        if (now > exp || exp - now < 60000) return (refreshingIdentity = authSession.refresh());
    }
    // if (isServer) return Promise.resolve(); // no need to refresh on server side
    else if (authToken.getRefreshToken()) return (refreshingIdentity = authSession.refresh());
    return Promise.resolve();
}
export function AuthInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    // in milliseconds
    const authUser = inject(AuthUserAccessor);
    const authToken = inject(AuthTokenAccessor);
    const authSession = inject(AuthSessionAccessor);
    return new Observable<HttpEvent<any>>((observer) => {
        let subscription: Subscription;

        tryRefreshToken(authUser, authToken, authSession, req)
            .then(() => {
                refreshingIdentity = undefined; //free up

                const token = authToken.getToken();

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
