import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
	pushAuthBranchUrl,
	traverseUrl,
	apiRoot,
	feeedDataStoreUrl,
	pushAnonBranchUrl,
	registerUrl,
	loginUrl,
	logoutUrl, 
	fetchBranchUrl,
	nodeUrl} from '../helpers/urls';
import { SSSCookieService } from './sss-cookie.service';
import { Action } from '@ngrx/store';
import { Pointer, Node, ListenerHash } from '../models';
import { UpdateNodeData } from '../models/updateNodeData';
import { SSSDomService } from './sss-dom-service';

@Injectable({
  providedIn: 'root'
})
export class SSSApiService {

	headerDict = {
		'Content-Type': 'application/json',
		'Accept': 'application/json',
		'Access-Control-Allow-Headers': 'Content-Type',
	}

	requestOptions = { headers: new HttpHeaders(this.headerDict) };

	private http = inject(HttpClient);
	private sssCookieService = inject(SSSCookieService);
	private sssDomService	= inject(SSSDomService);

	register( userobject ) : Observable<{ actions: Action[] }> {

		const testing_state = this.sssCookieService.getCookie("testing") ? this.sssCookieService.getCookie("testing").split("/").slice(-1)[0] : "";

		const payload = { instanceid: "mysyllabi", userobject, testing_state, argarray: [], client_date: new Date().setHours(12,0,0,0) };

		return this.http.post<{ actions: Action[] }>(registerUrl, JSON.stringify( payload ),this.requestOptions );
	}

	login( argarray = [], inheritpayload, userid, password ) : Observable<{ actions: Action[] }> {

		const testing_state = this.sssCookieService.getCookie("testing") ? this.sssCookieService.getCookie("testing").split("/").slice(-1)[0] : "";

		const payload = { instanceid: "mysyllabi", userid, password, argarray, inheritpayload, testing_state, client_date: new Date().setHours(12,0,0,0) };

        return this.http.post<{ actions: Action[] }>(loginUrl, JSON.stringify( payload ),this.requestOptions );
    }

	logout() : Observable<{ actions: Action[] }> {

		const testing_state = this.sssCookieService.getCookie("testing") ? this.sssCookieService.getCookie("testing").split("/").slice(-1)[0] : "";

		const payload = { instanceid: "mysyllabi", argarray: [], testing_state, client_date: new Date().setHours(12,0,0,0) };

        return this.http.post<{ actions: Action[] }>(logoutUrl, JSON.stringify( payload ),this.requestOptions );
    }

	refreshToken(token: string) {

        return this.http.post(apiRoot + 'refresh', { refreshToken: token });
    }

	fetchInstance( instanceid: string, argarray: Array<string> ): Observable<{ actions: Action[] }> {

		const testing_state = this.sssCookieService.getCookie("testing") ? this.sssCookieService.getCookie("testing").split("/").slice(-1)[0] : "";

		const payload = { instanceid: "mysyllabi", argarray, testing_state, client_date: new Date().setHours(12,0,0,0) };

		return this.http.post<{ actions: Action[] }>(traverseUrl, payload, this.requestOptions);
	}

	pushAnonBranch( argarray: Array<string>, listeners: ListenerHash, appid: string ): Observable<{ actions: Action[] }> {

		const payload = { argarray, listeners, appid: "mysyllabi", client_date: new Date().setHours(12,0,0,0) }

        return this.http.post<{ actions: Action[] }>( pushAnonBranchUrl, payload );
	}

	pushAuthBranch( instanceid: string, argarray: Array<string>, listeners: ListenerHash ): Observable<{ actions: Action[] }> {

		const payload = { argarray, instanceid, listeners, client_date: new Date().setHours(12,0,0,0) }

        return this.http.post<{ actions: Action[] }>( pushAuthBranchUrl, payload )
    }

    feedTestData( setName: string ): Observable<{ actions: Action[] }> {

        const payload = { setName, client_date: new Date().setHours(12,0,0,0) }

        return this.http.post<{ actions: Action[] }>( feeedDataStoreUrl, payload);
    }

	fetchBranch(pointerobj: Pointer): Observable<{ actions: Action[] }> {

        const payload = { branch_state: null, username: "GUEST", pointerobj, client_date: new Date().setHours(12,0,0,0) }

		return this.http.post<{ actions: Action[] }>(fetchBranchUrl, payload);
	}

	updateNode(username: string, tabId: string, changes: Partial<Node>): Observable<{ actions: Action[] }> {

		const payload = new UpdateNodeData(changes);

		const sisters = this.sssDomService.fetchSistersFromDOM( tabId );

		return this.http.post<{ actions: Action[] }>(`${nodeUrl}/UPDATE`, { payload, sisters });
	}
}
