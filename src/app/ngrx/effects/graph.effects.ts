import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { map, filter, switchMap, withLatestFrom, first } from 'rxjs/operators';
import { LoadNewRootInstantiation, Reset, SetApplicationNodeID, SubstituteAppNode } from '../actions/application.actions';
import { isPlatformBrowser } from '@angular/common';
import { SSSCookieService } from 'src/app/services/sss-cookie.service';
import { SSSLocalService } from 'src/app/services/sss-local.service';
import { Store, select } from '@ngrx/store';
import { AppState } from '../reducers';
import { getAppNodeId, getTabById, getTabs } from '../selectors/graph.selector';
import { Pointer, Tab } from 'src/app/models';
import { ComandeerOtherDays, LoadTab, SubstitutePointer } from '../actions/tab.actions';
import { SSSTabService } from 'src/app/services/sss-tab.service';
import { PushActions } from '../actions/beacon.actions';
import { getTabChanges } from '../selectors/change.selector';

@Injectable()
export class GraphEffects {

	private actions$ = inject(Actions);
	private sssLocalService = inject(SSSLocalService);
	private sssCookieService = inject(SSSCookieService);
	private sssTabService = inject(SSSTabService);
	private store = inject(Store<AppState>);
	private platformId = inject(PLATFORM_ID);

	LoadNewRootInstantiation$ = createEffect(() =>
		this.actions$.pipe(
			ofType(LoadNewRootInstantiation),
			filter((action) => isPlatformBrowser(this.platformId)),
			map(action => SetApplicationNodeID( { payload: action.payload.root_nodeid } ))
		)
	);

	AppId$ = createEffect(() =>
		this.actions$.pipe(
			ofType(SetApplicationNodeID, SubstituteAppNode),
			withLatestFrom(this.store.select(getAppNodeId)),
			filter(([action, appid]) => isPlatformBrowser(this.platformId)),
			map(([action, appid]) => { this.sssCookieService.setCookie("applicationNodeId", appid, 5); })
		),
		{ dispatch: false }
	);

	Reset$ = createEffect(() =>
		this.actions$.pipe(
			ofType(Reset),
			filter((action) => isPlatformBrowser(this.platformId)),
			map(action => this.sssCookieService.removeCookie("applicationNodeId"))
		),
		{ dispatch: false }
	);
	
	SubstitutePointer$ = createEffect(() =>
		this.actions$.pipe(
			ofType(SubstitutePointer),
			filter((action) => isPlatformBrowser(this.platformId)),
			switchMap((action: any) => this.store.pipe(select(getTabById({ id: action.payload.id })), first())),
			filter((tabobj: Tab) => isPlatformBrowser(!!tabobj)),
			map((tabobj: Tab) => this.sssLocalService.setObjByKey( tabobj._id, tabobj ) )
		),
		{ dispatch: false }
	);

	ComandeerOtherDays	= createEffect(() =>
		this.actions$.pipe(
			ofType(ComandeerOtherDays),
			withLatestFrom(this.store.select( getTabs ), this.store.select( getTabChanges )),
			map(([{ payload: timeline }, tabHash, changesHash]) => {
			
				const actions = tabHash[ timeline ][ 0 ].inventory.reduce((accum, pointer: Pointer) => {

					const tabid 		= this.sssTabService.deriveTabidFromPointer(pointer, 0);
					const comandeeredId = this.sssTabService.comandeerId(tabid);

					if ( !!tabHash[ comandeeredId ] || !tabHash[ tabid ] || !!changesHash[ tabid ]) { return accum; }

					return [
						...accum,
						LoadTab({ payload: { id: tabid, origin: "ComandeerOtherDays", tab: { ...tabHash[tabid][0], _id: comandeeredId } } }),
						LoadTab({ payload: { id: comandeeredId, origin: "ComandeerOtherDays", tab: { ...tabHash[tabid][0], _id: comandeeredId } } }),
						SubstitutePointer({ payload: { pointer, id: tabHash[timeline][0]._id, comandeer: true, origin: "ComandeerOtherDays" } })
					];
					
				}, []);

				this.store.dispatch( PushActions( { payload: actions } ) );
			})
		),
		{ dispatch: false }
	);


	// RemoveTab$ = createEffect(() =>
	// 	this.actions$.pipe(
	// 		ofType(RemoveTab, RemoveNode),
	// 		filter((action) => isPlatformBrowser(this.platformId)),
	// 		map((action: any) => this.sssLocalService.removeObjByKey( action.payload.id ) )
	// 	),
	// 	{ dispatch: false }
	// );
}
