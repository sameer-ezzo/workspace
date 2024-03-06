import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({providedIn:'root'})
export class ConnectionService {
  private connectionMonitor: Observable<boolean>;
  isOnline: boolean;
  constructor() {

    this.isOnline = window.navigator.onLine;
    this.connectionMonitor = new Observable((observer) => {
      window.addEventListener('offline', (e) => {
        this.isOnline = false;
        observer.next(false);
      });
      window.addEventListener('online', (e) => {
        this.isOnline = true;
        observer.next(true);
      });
    });
  }

  monitor(): Observable<boolean> {
    return this.connectionMonitor;
  }
}
