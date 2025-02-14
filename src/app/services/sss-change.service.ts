import { LoadTab, UpdatePointer } from './../ngrx/actions/tab.actions';
import { Injectable, inject } from '@angular/core';
import { SSSTabService } from './sss-tab.service';
import { Observable, of, forkJoin, timer } from 'rxjs';
import { CutTabFromChanges, LoadChanges, LoadNodeChanges } from '../ngrx/actions/change.actions';
import { Action, select, Store } from '@ngrx/store';
import { map, switchMap, first, tap } from 'rxjs/operators';
import { AppState } from '../ngrx/reducers';
import { getTabById, getTabs } from '../ngrx/selectors/graph.selector';
import * as _ from 'lodash';
import { SSSMutateAnonService } from './sss-mutate.anon.service/sss-mutate.anon.service';
import { Command, DeleteData, Pointer, Node, InjectData, Ancestry, ChangeWrapper, Tab } from '../models';
import { SSSAccountService } from './sss-account.service';
import { PushActions } from '../ngrx/actions/beacon.actions';
import { LoadNode, SubstituteNode, UpdateNode } from '../ngrx/actions/node.actions';
import { SSSMutateAuthService } from './sss-mutate.anon.service/sss-mutate.auth.service';
import * as merge from 'deepmerge';
import { SSSApiService } from './sss-api.service';
import { SSSMitosisService } from './sss-mitosis.service';

@Injectable({
  providedIn: 'root'
})
export class SSSChangeService {

	private sssTabService  			= inject(SSSTabService);
	private sssMutateAnonService 	= inject(SSSMutateAnonService);
	private sssMutateAuthService 	= inject(SSSMutateAuthService);
	private sssApiService 			= inject(SSSApiService);
	private sssMitosisService 		= inject(SSSMitosisService);
	private store 					= inject(Store<AppState>);
	private sssAccountService 		= inject(SSSAccountService);


	processChanges( ancestry: Ancestry, pagIdx: number, changes: ChangeWrapper ): Observable<Action[]> {

		const funcList = [
							this.decorateChildPointer( ancestry, pagIdx, changes ),
							// this.decorateParentPointer( ancestry, changes ),
							this.decorateTabObjWithAdditions( ancestry, pagIdx, changes ),
							this.executeCutChange( ancestry, pagIdx )
						];

		return forkJoin( funcList ).pipe(map(( [ s1, s2, s3 /* , s4 */ ] ) => [ ...s1, ...s2, ...s3 /* , ...s4  */] ) );
	}

	decorateParentPointer( ancestry: Ancestry, { mutations }: ChangeWrapper ): Observable<Action[]> {

		if( !mutations ) { return of([]); }

        const changes = merge.all( mutations ) as Pointer;

		return of( [ UpdatePointer( { payload: { ancestry, changes } } ) ] )
	}

	decorateChildPointer( { pointer, parentTabid }: Ancestry, pagIdx: number, { update_child }: ChangeWrapper ): Observable<Action[]> {

		if( !update_child ) { return of([]); }

	}

	decorateTabObjWithAdditions( { pointer }: Ancestry, pagIdx: number, { additions }: ChangeWrapper ): Observable<any> {

		if( !additions ) { return of([]); }

		const tabid = this.sssTabService.deriveTabidFromPointer( pointer, pagIdx );

		return this.store.select(getTabById({ id: tabid })).pipe(
			first(),
			switchMap(( oldTabObj: Tab ) => {

				const newTabObj = this.sssTabService.processContribution( _.cloneDeep(oldTabObj), [...additions] );

				const transaction = !newTabObj ? [] : [ // !newTabObj is a timeline already with today
					LoadTab( { payload: { id: newTabObj._id, tab: newTabObj, origin: "decorateTabObjWithAdditions" } } ),
					LoadTab( { payload: { id: oldTabObj._id, tab: newTabObj, origin: "decorateTabObjWithAdditions" } } )
				]; // second LoadTab is just to trigger the list component selector subscribe block

				return of(transaction);
			})
		);
	}

	executeCutChange( { pointer }: Ancestry, pagIdx: number ): Observable<Action[]> {

		const tabid = this.sssTabService.deriveTabidFromPointer( pointer, pagIdx );

        return of([ CutTabFromChanges( { payload: { tabid } } ) ]);
	}

	fetchChangeActions(tabid: string, { action, payload }: Command, ancestry: Ancestry ): Observable<Action[]> {

		return this.store.select(getTabById({ id: tabid })).pipe(
			first(),
			map(( tab: Tab ) => {

				const oldTabObj = _.cloneDeep(tab);

				switch ( action ) {

					case "INJECT"	: return [ oldTabObj, this.sssMutateAnonService.triggerInject( oldTabObj, payload, ancestry.pointer ) ];
					case "DELETE"	: return [ oldTabObj, this.sssMutateAnonService.triggerDelete( oldTabObj, payload ) ];
					case "MOVE"		: return [ oldTabObj, this.sssMutateAnonService.triggerMove(   oldTabObj, payload ) ];
				}
			}),
			switchMap(( [ oldTabObj, newTabObj ]: [ Tab, Tab ] ) => this.sssMitosisService.measureInventory(oldTabObj, newTabObj, ancestry)),
			// switchMap(( actions: Action[] ) => [ ...actions, LoadTab( { payload: { id: oldTabObj._id, tab: newTabObj } } ) ]) 
		) 	// second LoadTab is just to trigger the list component selector subscribe block
	}

	changePointerState( ancestry: Ancestry, changes: Pointer ): Observable<{ actions: Action[]; } | boolean> {

		// if(this.sssAccountService.determineIfLoggedIn()) {
		// 	return this.sssMutateAuthService.triggerUpdate( this.sssAccountService.getUser()._id, ancestry, changes );
		// } else {
			return of(true).pipe( tap( () => this.sssMutateAnonService.triggerUpdate( ancestry, changes ) ) );
		// }
	}

	addNewPointer( ancestry: Ancestry, name: string ): Observable<{ actions: Action[]; } | 0> {

		const tabid = this.sssTabService.deriveTabidFromPointer(ancestry.pointer, 0);

		this.store.dispatch( PushActions( { payload: LoadChanges({ payload: { [ tabid ]: { mutations: [ { disabled: true } ] } } } ) }) );

		if(this.sssAccountService.determineIfLoggedIn()) {

			return this.store.pipe( 	
				select(getTabs), 
				first(),
				map( (tabHash: { [ tabid: string ]: Tab[] } ) => tabHash[ tabid ][0] ),
				switchMap( ( tab: Tab ) => this.sssMutateAuthService.triggerInsert(name, tab.revision, tab) ),
				tap((res: { actions: Action[] }) => { this.store.dispatch( PushActions ({ payload: res.actions})) }),
				tap ( () => {
					const comandeeredId = this.sssTabService.comandeerId( ancestry.parentTabid );
					this.store.dispatch( PushActions ({ payload: LoadChanges({ payload: { [ comandeeredId ]: { mutations: [ { disabled: false } ] } } }) }) );
				})
			);

		} else {

			const comandeeredId 	= this.sssTabService.comandeerId( tabid );
			const nodeid 			= `GUEST_${name.toLowerCase().split(" ").join("-")}`;
			const color 			= `#${Math.floor( Math.random() * 16777215 ).toString(16)}`;
			const node 				= new Node(nodeid, color, name, "folder");
			const pointer 			= new Pointer("edit", null, ( Date.now() ).toString(), nodeid);
			const command 			= new Command("INJECT", new InjectData(pointer, 0), tabid);

			const transaction = [
				LoadNode( { payload: { id: nodeid, node } } ),
				LoadNodeChanges ( { payload: { [ ancestry.pointer._id ] : command } } ),
				LoadChanges({ payload: { [ comandeeredId ]: { mutations: [ { disabled: false } ] } } })
			]

			return timer(2000).pipe( tap ( () => this.store.dispatch( PushActions ({ payload: transaction }) ) ) );
		}
	}

	 deletePointer( ancestry: Ancestry, idx: number, pagidx: number ): Observable<{ actions: Action[]; } | 0> {

		const { pointer, parentTabid, parentNodeid } = ancestry;

		this.store.dispatch( PushActions( { payload: LoadChanges({ payload: { [ parentTabid ]: { mutations: [ { disabled: true } ] } } } ) }) );

		if(this.sssAccountService.determineIfLoggedIn()) {

			return this.store.pipe( 	
				first(),
				select(getTabs), 
				map( (tabHash: { [ tabid: string ]: Tab[] } ) => tabHash[ parentTabid ][0] ),
				switchMap( ( tab: Tab ) => this.sssMutateAuthService.triggerDelete(pointer, idx, tab.revision, tab) ),
				tap((res: { actions: Action[] }) => { this.store.dispatch( PushActions ({ payload: res.actions})) }),
				tap ( () => {
					const comandeeredId = this.sssTabService.comandeerId( ancestry.parentTabid );
					this.store.dispatch( PushActions ({ payload: LoadChanges({ payload: { [ comandeeredId ]: { mutations: [ { disabled: false } ] } } }) }) );
				})
			)

		} else {
			
			const comandeeredId = this.sssTabService.comandeerId( ancestry.parentTabid );
			const command 		= new Command("DELETE", new DeleteData( pointer, idx ), parentTabid);
			const transaction 	= [
				LoadNodeChanges ( { payload: { [ parentNodeid ] : command } } ),
				LoadChanges({ payload: { [ comandeeredId ]: { mutations: [ { disabled: false } ] } } })
			];

			return timer(1000).pipe( tap ( () => this.store.dispatch( PushActions ({ payload: transaction }) ) ) );
		}
	}

	savePointerChanges( ancestry: Ancestry, changes: Partial<Pointer>, pointerIndex: number ): Observable<{ actions: Action[]; } | boolean> {

		this.store.dispatch( PushActions ({ payload: [ LoadChanges({ payload: { [ ancestry.parentTabid ]: { mutations: [ { disabled: true } ] } } }) ] } ) );

		if(this.sssAccountService.determineIfLoggedIn()) {

			return this.store.pipe( 	
				first(),
				select(getTabs), 
				map( (tabHash: { [ tabid: string ]: Tab[] } ) => tabHash[ ancestry.parentTabid ][0] ),
				switchMap( ( tab: Tab ) => this.sssMutateAuthService.triggerUpdate(changes, tab, pointerIndex) ),
				tap((res: { actions: Action[] }) => { this.store.dispatch( PushActions ({ payload: res.actions})) }),
				tap ( () => {
					const comandeeredId = this.sssTabService.comandeerId( ancestry.parentTabid );
					this.store.dispatch( PushActions ({ payload: LoadChanges({ payload: { [ comandeeredId ]: { mutations: [ { disabled: false } ] } } }) }) );
				})
			)

		} else {

			return timer(1000).pipe( 
				switchMap( 	() => this.changePointerState( ancestry, changes ) ),
				tap ( () => this.store.dispatch( PushActions ({ payload: LoadChanges({ payload: { [ ancestry.parentTabid ]: { mutations: [ { disabled: false } ] } } }) }) ) ) 
			);
		}
	}

	updateNode( ancestry: Ancestry, changes: Partial<Node> ): Observable<{ actions: Action[]; } | 0> {

		this.store.dispatch( PushActions ({ payload: [
			LoadChanges({ payload: { [ ancestry.parentTabid ]: { mutations: [ { disabled: true } ] } } })
		] } ) );

		if(this.sssAccountService.determineIfLoggedIn()) {

			return this.sssApiService.updateNode(this.sssAccountService.getUser()._id, ancestry.parentTabid, changes).pipe(
				tap((res: { actions: Action[] }) => { this.store.dispatch( PushActions ({ payload: res.actions})) }),
				tap ( () => this.store.dispatch( PushActions ({ payload: LoadChanges({ payload: { [ ancestry.parentTabid ]: { mutations: [ { disabled: false } ] } } }) }) ) ) 
			);

		} else {
		 
			const transaction 	= [
				UpdateNode( { payload: { ancestry, changes }}),
				SubstituteNode({ payload: ancestry.pointer._id }), 
				
				LoadChanges({ payload: { [ ancestry.parentTabid ]: { mutations: [ { disabled: false } ] } } })
				
			];

			return timer(1000).pipe( tap ( () => this.store.dispatch( PushActions ({ payload: transaction }) ) ) );
		}
	}
}
