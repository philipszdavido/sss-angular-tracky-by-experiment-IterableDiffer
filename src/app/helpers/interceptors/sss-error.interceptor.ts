import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../ngrx/reducers';
import { Logout } from '../../ngrx/actions/auth.actions';
import { PushActions } from '../../ngrx/actions/beacon.actions';
import { SSSCookieService } from '../../services/sss-cookie.service';
import { SSSApiService } from 'src/app/services/sss-api.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    private sssCookieService    = inject(SSSCookieService);
    private sssApiService       = inject(SSSApiService);
    private store               = inject(Store<AppState>);

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        return next.handle(request).pipe(catchError(err => {
            if (err instanceof HttpErrorResponse && !request.url.includes('login') && err.status === 401) {
                return this.handle401Error(request, next);
            }

            const error = err.error.message || err.statusText;
            return throwError(error);
        }))
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler) {

        if (!this.isRefreshing) {

            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            const token = this.sssCookieService.getCookie("refreshToken");
            if (token)

            return this.sssApiService.refreshToken(token).pipe(
                    switchMap((token: any) => {

                        this.sssCookieService.removeCookie("refreshToken");

                        this.sssCookieService.setCookie("refreshToken", token.accessToken, 5);

                        return next.handle(request);
                    }),
                    catchError((err) => {
                        this.store.dispatch(PushActions({ payload: Logout() }));
                        return throwError(err);
                    })
            );
        }

        return this.refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap((token) => next.handle(request))
        );

    }
}
