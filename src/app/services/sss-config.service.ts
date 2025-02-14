import { filter, switchMap, tap } from 'rxjs/operators';
import { Injectable, PLATFORM_ID, makeStateKey, TransferState, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { PushActions } from 'src/app/ngrx/actions/beacon.actions';
import { isPlatformBrowser } from '@angular/common';
import { of, Observable } from 'rxjs';
import { SSSWebsocketService } from 'src/app/services/sss-websocket.service';
import { Payload, Template, Node } from '../models';
import { AppState } from '../ngrx/reducers';
import * as TabTemplates from '../tree/templates';
import * as componentRegistry from '../tree/state';
import { SSSAccountService } from './sss-account.service';
import { SSSApiService } from './sss-api.service';
import { Location } from '@angular/common';
import { SSSCookieService } from './sss-cookie.service';
import { SSSLocalService } from 'src/app/services/sss-local.service';
import { SetApplicationNodeID } from '../ngrx/actions/application.actions';
import * as _ from 'lodash';


const BATCH_KEY = makeStateKey<Payload>('batch');

@Injectable()
export class SSSConfigService {

	version 					: string;
	instance 					: string;
	apiEndpointSomeData 		: string;

	private transferState 		= inject(TransferState);
	private store 				= inject(Store<AppState>);
	private sssAccountService 	= inject(SSSAccountService);
	private sssWsService 		= inject(SSSWebsocketService);
	private sssApiService 		= inject(SSSApiService);
	private sssLocalService 	= inject(SSSLocalService);
	private sssCookieService 	= inject(SSSCookieService);
	private location 			= inject(Location);
	private platformId 			= inject(PLATFORM_ID);

	load() : Promise<any> {

		return of(true).pipe(
			filter(res => this.sssCookieService.getCookie("testing") && this.sssCookieService.getCookie("testing").length > 0),
			switchMap(	res => 	this.sssAccountService.determineIfLoggedIn() || !this.sssCookieService.getCookie("applicationNodeId")
									? this.TEMPlaunchApplication() 	// FIRST VISIT OR RETURNING LOGGED IN USER
									: this.TEMPreviveApplication()	// SECOND+ VISIT ONLY FOR ANONYMOUS USER
			)
		).toPromise()
	}

	TEMPlaunchApplication() : Observable<any> {

		const urlargs: Array<string> = this.location.path().split('/');

		return this.sssApiService.fetchInstance( "mysyllabi", urlargs )
			.pipe(
				tap(batch => {

					// if( this.sssAccountService.determineIfLoggedIn() ) { this.sssWsService.connect(); }

					this.store.dispatch(PushActions( { payload: batch.actions } ) );
				})
			)
	}

	launchApplication() : Observable<any> {

        if( isPlatformBrowser(this.platformId) )  {

            this.store.dispatch(PushActions( { payload: this.transferState.get(BATCH_KEY, null).actions } ) );

			this.transferState.remove(BATCH_KEY);

            // if( !this.cookieService.getCookie("_id") ) { this.cookieService.setGuestUserCookie(); } // FIRST VISIT

			return of();

        } else { // HERE IS WHERE YOU WILL GET AN INSTANCE AND PASS TO transferState

            const urlargs: Array<string> = this.location.path().split('/');

			return 	this.sssApiService.fetchInstance( "mysyllabi", urlargs )
						.pipe(
							tap(batch => {

								this.store.dispatch(PushActions( { payload: batch.actions } ) );

								this.transferState.set(BATCH_KEY, batch);
							})
						);
        }
	}

	TEMPreviveApplication() : Observable<any> {

		const urlargs : Array<string>       = this.location.path().split('/').filter(el => !!el);
		const cookieListener                = this.sssCookieService.getCookie("listeners");
		const listeners                     = cookieListener ? JSON.parse( cookieListener ) : {};
		const applicationNodeId             = this.sssCookieService.getCookie("applicationNodeId");

		return 	of(true).pipe(
						  tap(res   => this.store.dispatch(PushActions( { payload: SetApplicationNodeID({ payload: applicationNodeId }) } ) ) ),
					switchMap(res 	=> this.sssLocalService.restoreTree()),
						  tap(batch => this.store.dispatch(PushActions( { payload: batch.actions } ) ) ),
					   filter(res 	=> urlargs.length > 0),
					switchMap(res 	=> this.sssApiService.pushAnonBranch( urlargs, listeners, applicationNodeId )),
						  tap(batch => {
							  this.store.dispatch(PushActions( { payload: batch.actions } ) )
							} )
				);
	}

	reviveApplication() : Observable<any> {

		// this.setInstanceId();

        if( isPlatformBrowser( this.platformId ) ) {

            console.log("/fetch-existing-anon-instance", this.transferState.get(BATCH_KEY, null) );

            this.store.dispatch(PushActions( { payload: this.transferState.get(BATCH_KEY, null).actions } ) );

        } else { // HERE IS WHERE YOU WILL GET A BRANCH FOR EACH LISTENER AND PASS TO transferState

            const urlargs : Array<string>       = this.location.path().split('/');
            const cookieListener                = this.sssCookieService.getCookie("listeners");
            const listeners                     = cookieListener ? JSON.parse( cookieListener ) : {};
            const applicationNodeId             = this.sssCookieService.getCookie("applicationNodeId");

            return 	this.sssApiService.pushAnonBranch( urlargs, listeners, applicationNodeId )
						.pipe(
							tap(batch => {
								this.transferState.set(BATCH_KEY, batch)
							})
						);
        }
	}

	fetchComponentClass(tabset: Template[], state: string): componentRegistry.SSSStateComponent {

		const compKey = this.solveComponentKeyFromState( tabset, state );

		return componentRegistry[compKey] || componentRegistry.SSSStubComponent;
	}

	rollTabArray( nodeobj: Node ): Template[] {

		if(!nodeobj) { return []; }

		switch ( nodeobj.type )
            {
				case 'folder'       :      return TabTemplates.folderNodeTabCollection.concat(   nodeobj.auxtabs || [] );
				case 'generic'      :      return TabTemplates.folderNodeTabCollection.concat(   nodeobj.auxtabs || [] );
                case 'category'     :      return TabTemplates.folderNodeTabCollection.concat(   nodeobj.auxtabs || [] );
                case 'calendar'     :      return TabTemplates.calendarNodeTabCollection.concat( nodeobj.auxtabs || [] );
                case 'poster'       :      return TabTemplates.posterNodeTabCollection.concat(   nodeobj.auxtabs || [] );
                case 'vacant'       :      return TabTemplates.vacantNodeTabCollection.concat(   nodeobj.auxtabs || [] );
                case 'stub'         :      return TabTemplates.stubNodeTabCollection.concat( [] );
                case 'promo'        :      return nodeobj.auxtabs || [];
                case 'sponsor'      :      return nodeobj.auxtabs || [];
				case 'generic' 		: 	   return TabTemplates.folderNodeTabCollection.concat( nodeobj.auxtabs || [] );
				case 'sponsor' 		: 	   return nodeobj.auxtabs || [];
                default:                   return nodeobj.auxtabs || [];
                // INCLUDES COLUMNS, TAXONOMY, HISTORY, FAVORITES, & CATEGORIES
            }
	}

	solveTemplateFromTabSet( tabset: Template[], state: string ) : Template {

		return tabset.filter(template => template.name === state)[0];
	}

	solveComponentKeyFromState( tabset: Template[], state: string ): string  {
		
		const { template }	= this.solveTemplateFromTabSet( tabset, state ) || tabset[0];

		if( !template ) { throw new Error("bad-pointer-currenttab"); }

		return template;
	}
}

export function appInit(sssConfigService: SSSConfigService) {
	return () => sssConfigService.load();
}
