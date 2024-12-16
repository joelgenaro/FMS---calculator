import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DataService } from './data.service';

@Injectable()
export class AuthService extends DataService {
    private _isLoggedIn = new BehaviorSubject<boolean>(false);
    public showExpertMode = new BehaviorSubject<boolean>(false);
    public selectedMode = new BehaviorSubject<string>(null);
    public rememberMe = new BehaviorSubject<boolean>(false);
    user_auth = new BehaviorSubject<any>(null);
    constructor(protected router: Router, protected http: HttpClient) {
        super(router, http);
        this._isLoggedIn.next(localStorage.getItem('accessToken') === null ? false : true);
    }

    storeCredentials(accessToken: string) {
        localStorage.setItem('accessToken', accessToken);
        this._isLoggedIn.next(true);
    }

    login(username: string, password: string) {
        return this.post(`${this.apiBase}/users/login/`, { username, password });
    }

    forgotPassword(email: string, lang: string) {
        return this.post(`${this.apiBase}/users/forgot-password/`, { email, lang });
    }

    register(newUser: any) {
        return this.post(`${this.apiBase}/users/sign-up/`, newUser);
    }

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user_auth');
        localStorage.removeItem('userData');
        this._isLoggedIn.next(false);
    }

    resetPassword(token: string, password: string, repeatPassword: string) {
        return this.post(`${this.apiBase}/users/reset-password/${token}/`, { password, repeat_password: repeatPassword });
    }

    confirmAccount(token) {
        return this.post(`${this.apiBase}/users/confirm-account/`, { token });
    }

    /**
     * @author Ivan Aleksandrov
     * @param isLoggedIn
     */
    setIsLoggedIn(isLoggedIn: boolean): void {
      this._isLoggedIn.next(isLoggedIn);
    }

    get isLoggedIn(): Observable<boolean> {
      return this._isLoggedIn.asObservable();
    }
}
