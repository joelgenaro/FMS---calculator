import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';

export class DataService {
    protected apiBase: string;
    constructor(protected router: Router, protected http: HttpClient) {
        this.apiBase = environment.apiUrl;
    }

    private getHeaders(): any {
        const headers: any = {
            'Content-Type': 'application/json'
        };
        const options: any = {
            headers: new HttpHeaders(headers)
        };

        // if (localStorage.getItem('accessToken') != null) {
        //     headers['Authorization'] = 'Token ' + localStorage.getItem('accessToken');
        // }

        return options;
    }

    private handleError(error: HttpErrorResponse) {
        if (error.error instanceof ErrorEvent) {
            alert('Please check internet connection');
        } else {
            if (error.status === 401) {
                localStorage.removeItem('accessToken');
            }
        }
        // return an observable with a user-facing error message
        return throwError(error);
    }

    protected post<T>(url: string, data: any): Observable<T> {
        return this.http.post<T>(url, data, { headers: { 'Content-Type': 'application/json' } }).pipe(catchError(error => this.handleError(error)));
    }

    protected postForm(url: string, data: any) {
        const headers = this.getHeaders();
        return this.http
            .post(url, data, { headers, responseType: 'text' }).pipe(catchError(error => this.handleError(error)));
    }

    protected get<T>(url: string) {
      const options = this.getHeaders();
        return this.http
            .get<T>(url).pipe(catchError(error => this.handleError(error)));
    }

    protected delete(url: string) {
        return this.http
            .delete(url, this.getHeaders()).pipe(catchError(error => this.handleError(error)));
    }

    protected patch<T>(url: string, data: any) {
        return this.http
            .patch<T>(url, data, { headers: { 'Content-Type': 'application/json' } }).pipe(catchError(error => this.handleError(error)));
    }
}
