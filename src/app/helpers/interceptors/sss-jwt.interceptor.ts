import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SSSCookieService } from 'src/app/services/sss-cookie.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {

    private sssCookieService = inject(SSSCookieService)

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add auth header with jwt if user is logged in and request is to api url
        const token      	= this.sssCookieService.getCookie("token");
        const isApiUrl 		= request.url.startsWith(environment.httpEndpoint); // API URL

        if (isApiUrl && token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(request);
    }
}
