import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, Subscription } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class AuthInterceptor implements HttpInterceptor {
  // in milliseconds
  REFRESH_IDENTITY_BEFORE = 60000;

  refreshingIdentity?: Promise<any>;

  constructor(public auth: AuthService) { }

  // todo retry on error
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return new Observable<HttpEvent<any>>((observer) => {
      let subscription: Subscription;

      //resolve promise before http request
      this.tryRefreshToken()
        .then(() => {
          this.refreshingIdentity = undefined; //free up

          const token = this.auth.get_token();
          if (token) { request = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }); }

          subscription = next.handle(request).subscribe(observer);
        })
        .catch(error => {
          observer.error(error)
        });

      return () => { if (subscription) subscription.unsubscribe(); } //unsubscribe
    });
  }

  private async tryRefreshToken() {

    if (this.refreshingIdentity) return this.refreshingIdentity;
    else if (this.auth.user) {
      const now = Date.now();
      const exp = new Date(this.auth.user.exp * 1000).getTime();
      if (now > exp || (exp - now) < 60000)
        return this.refreshingIdentity = this.auth.refresh();
    }
    else if (this.auth.get_refresh_token())
      return this.refreshingIdentity = this.auth.refresh();
  }

}
