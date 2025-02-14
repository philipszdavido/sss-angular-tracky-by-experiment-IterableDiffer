import { Injectable, inject } from '@angular/core';
import { SSSCookieService } from './sss-cookie.service';

@Injectable({
  providedIn: 'root'
})
export class SSSTokenService {

	private sssCookieService = inject(SSSCookieService);

	loadToken( token: string ): void {

		this.sssCookieService.removeCookie("token");

		this.sssCookieService.setCookie("token", token, 5);
	}

	removeToken(): void {

		this.sssCookieService.removeCookie("refreshToken");
		
		this.sssCookieService.removeCookie("token");
	}
}
