import { getListeners } from './../selectors/graph.selector';
import { PushActions } from './../actions/beacon.actions';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable, PLATFORM_ID, Inject, inject } from '@angular/core';
import { map, filter, withLatestFrom } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { RegisterListener, UnRegisterListener } from '../actions/listener.actions';
import { SSSCookieService } from 'src/app/services/sss-cookie.service';
import { Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { SSSListenerService } from 'src/app/services/sss-listener.service';
import { SSSTabService } from 'src/app/services/sss-tab.service';
import { ReloadTab } from '../actions/tab.actions';
import { SSSSisterService } from 'src/app/services/sss-sister.service';


@Injectable()
export class ListenerEffects {
	
	private actions$ 				= inject(Actions);
	private store 					= inject(Store<AppState>);
	private sssCookieService 		= inject(SSSCookieService);
	private sssListenerService 		= inject(SSSListenerService);
	private sssSisterService 		= inject(SSSSisterService);
	private sssTabService 			= inject(SSSTabService);
	private platformId 				= inject(PLATFORM_ID);

	RegisterListener$ = createEffect(() =>
		this.actions$.pipe(
			ofType(RegisterListener),
			filter(action => isPlatformBrowser(this.platformId)),
			withLatestFrom(this.store.select(getListeners)),
			map(([action, listenerHash]) => {

				this.sssCookieService.setCookie("listeners", JSON.stringify(listenerHash), 5);

				const pointer 				= action.payload.ancestry.pointer;
				const first 				= this.sssListenerService.isFirstListener(listenerHash, action.payload.ancestry);
				const tabid 				= this.sssTabService.deriveTabidFromPointer( pointer, 0 );
				const sisterList 			= this.sssSisterService.getSisterTabidList( tabid );

				return PushActions( { 
					
					payload: first 	? sisterList.filter((sister: string) => 
														sister != tabid 
														&& !this.sssListenerService.tabExistsInListenerHash( sister, listenerHash)
														// && !this.sssTabService.hasBeenComandeered(sister)
														)
							  						.map((sister: string) => ReloadTab( { payload: { id: sister, origin: "RegisterListener$" } } ) ) 
										: [] 
				} );
			})	// so potential followers can register
		)
	);

	UnRegisterListener$ = createEffect(() =>
		this.actions$.pipe(
			ofType(UnRegisterListener),
			filter(action => isPlatformBrowser(this.platformId)),
			withLatestFrom(this.store.select(getListeners)),
			map(([action, listenerHash]) => {

				this.sssCookieService.setCookie("listeners", JSON.stringify(listenerHash), 5);
			})
		),
		{ dispatch: false }
	);
}
