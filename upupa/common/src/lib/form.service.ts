import { Injectable } from '@angular/core';
import { ObjectId, DataService } from '@upupa/data';
import { BehaviorSubject } from 'rxjs';
import { delay } from 'rxjs/operators';
import { AuthService } from '@upupa/auth';
import { Router } from '@angular/router';
import { LanguageService } from '@upupa/language';
import { SnackBarService } from './snack-bar.service';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  get loading() { return this._loading$.value; }
  set loading(value: boolean) { this._loading$.next(value); }
  _loading$ = new BehaviorSubject(false);
  loading$ = this._loading$.asObservable().pipe(delay(200));

  constructor(public auth: AuthService,
    public data: DataService,
    public router: Router,
    public langSvr: LanguageService,
    public snack: SnackBarService) {

  }

  async save(path: string, model: any, goto?: string) {
    this._loading$.next(true);
    const id = model._id || ObjectId.generate();
    try {
      await this.data.put(`/${path}/${id}`, model)
      this.snack.openSuccess();
      if (goto) this.router.navigateByUrl(`/${this.langSvr.language}/${goto}`)
    } catch (error) {
      this.snack.openFailed('not-saved', error);
    } finally {
      this._loading$.next(false);
    }
  }

  async scrollToError() {
    this.snack.openFailed('validation-error')
    setTimeout(() => {//wait till invalid class is applied
      const el = <HTMLElement>(document.querySelector('mat-form-field.ng-invalid') || document.querySelector('mat-checkbox.ng-invalid') || document.querySelector('mat-radio-group.ng-invalid'));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => { el.focus(); }, 400); //wait scroll animation
      }
    }, 200);
  }

}