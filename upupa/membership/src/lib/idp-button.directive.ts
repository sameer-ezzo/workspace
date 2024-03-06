import { Input, EventEmitter, Output, ElementRef, inject, AfterViewInit, Directive, NgZone } from '@angular/core';
import { loadScript } from './load-script.func';

import { AuthService } from '@upupa/auth';
import { IdpName } from './types';

declare let google: any;

@Directive({
  selector: '[idp-button]',
  exportAs: 'idpButton'
})
export class IdpButtonDirective {

  private readonly host = inject(ElementRef).nativeElement;

  private _idp: any;
  @Input()
  public get idp(): any {
    return this._idp;
  }
  public set idp(value: any) {
    if (!value) return;
    this._idp = value;
    this.init(this.idp);
  }

  @Output() success = new EventEmitter<any>();

  initializedFor = null as IdpName
  initializingFor = null as IdpName

  private async init(idp: any) {
    if (this.initializingFor === idp.idpName) return;
    if (this.initializedFor === idp.idpName) return;

    if (idp.idpName === 'google') {
      this.initializingFor = idp.idpName;
      await this.initializeGoogleSignIn();
      this.initializedFor = idp.idpName;
      this.initializingFor = null;
    }
  }

  private readonly auth = inject(AuthService)
  private readonly zone = inject(NgZone)
  async initializeGoogleSignIn() {
    await loadScript('https://accounts.google.com/gsi/client');

    const options = {
      client_id: this.idp.clientId,
      ...this.idp.attributes
    }
    if (this.idp.attributes.ux_mode === 'popup') options['callback'] = async (e) => {
      this.zone.run(async () => {
        const res = await this.auth.signin_Google({ token: e.credential })
        this.success.emit(res)
      })
    }

    google.accounts.id.initialize(options)

    google.accounts.id.renderButton(
      this.host,
      { theme: "outline", size: "large", ...this.idp.customize }
    );

    google.accounts.id.prompt();

  }
}
