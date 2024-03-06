import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@upupa/auth';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(public http: HttpClient, private auth: AuthService) { }

  async adminResetPwd(pwdInfo: { email: string, new_password: string, forceChangePwd: boolean }): Promise<{ result: boolean }> {
    return firstValueFrom(this.http.post<{ result: boolean }>(`${this.auth.baseUrl}/adminreset`, pwdInfo))
  }
}
