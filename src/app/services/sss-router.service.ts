import { getLastClicked } from './../ngrx/selectors/graph.selector';
import { SSSAccountService } from './sss-account.service';
import { getAppNodeId, getUrl } from 'src/app/ngrx/selectors/graph.selector';
import { Injectable, PLATFORM_ID, Inject, inject } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common'
import { switchMap, first, withLatestFrom, filter } from 'rxjs/operators';
import { SSSCookieService } from './sss-cookie.service';
import { SSSApiService } from './sss-api.service';
import { of, Observable, forkJoin } from 'rxjs';
import { Store, select, Action } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { PushActions } from '../ngrx/actions/beacon.actions';
import { Ancestry, ListenerHash } from '../models';
import { UpdateCurrentUrl } from '../ngrx/actions/listener.actions';
import { SetLastClicked } from '../ngrx/actions/tab.actions';
import { SSSMutateAnonService } from './sss-mutate.anon.service/sss-mutate.anon.service';

@Injectable({
  providedIn: 'root'
})
export class SSSRouterService {

	private previous: string;

	private sssCookieService 		= inject(SSSCookieService);
	private sssMutateAnonService 	= inject(SSSMutateAnonService);
	private sssApiService 			= inject(SSSApiService);
	private store 					= inject(Store<AppState>);
	private sssAccountService 		= inject(SSSAccountService);
	private location 				= inject(Location);
	private platformId 				= inject(PLATFORM_ID);

  	constructor() {

        if( isPlatformBrowser(this.platformId) ) {

			this.store.select( getUrl ).pipe(
				filter((url: string) => !!url),
				withLatestFrom(this.store.select( getLastClicked )),
				switchMap(([url, lastClicked]: [ string, Ancestry ] ) => {

					return forkJoin([this.handleUrlChange(url), of(lastClicked)]);
				})

			).subscribe( ( [ batch, ancestry ]: [ { actions: Action[] }, Ancestry ]) => {

				this.sssMutateAnonService.triggerUpdate( ancestry, { loading: false } );

				this.store.dispatch(PushActions( { payload: batch.actions } ) );
             });
		}
	}

	handleUrlChange( url: string ): Observable<{ actions: Action[] }> {

		const empty 	=  url == '';
		const rerun 	=  this.previous == url;
		const auth 		=  this.sssAccountService.determineIfLoggedIn();
		const anon 		= !this.sssAccountService.determineIfLoggedIn();

		const argarray 	=  [url]; // url.split('/').slice(1)
        const cookie 	=  this.sssCookieService.getCookie("listeners");
        const listeners =  cookie ? JSON.parse( cookie ) : {};

		this.previous   =  url;

		switch(true) {

			case empty 	:  return of();
			case rerun 	:  return of();
			case auth 	:  return this.handleAuth( argarray, listeners );
			case anon 	:  return this.handleAnon( argarray, listeners );
		}
	}

	handleAuth( instantiations: string[], listeners: ListenerHash ): Observable<{ actions: Action[] }> {

		return this.store.pipe(
			first(),
			select(getAppNodeId),
			switchMap((appId: string) => this.sssApiService.pushAuthBranch( appId, instantiations, listeners ))
		);
	}

	handleAnon( instantiations: string[], listeners: ListenerHash ): Observable<{ actions: Action[] }> {

		const applicationNodeId = this.sssCookieService.getCookie("applicationNodeId");

		return this.sssApiService.pushAnonBranch( instantiations, listeners, applicationNodeId );
	}

	handleNodeClick( ancestry: Ancestry ) {

		this.location.go('/' + ancestry.pointer._id);

		const transaction = [
			SetLastClicked( { payload: ancestry } ),
			UpdateCurrentUrl( { payload: ancestry.pointer._id } )
		];

		this.store.dispatch(PushActions( { payload: transaction } ) );
	}
}
