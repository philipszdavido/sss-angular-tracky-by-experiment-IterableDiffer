import { Ancestry, Pointer, Tab } from 'src/app/models';
import { MoveData } from './../models/moveData';
import { InjectData } from './../models/injectData';
import { Injectable, inject } from '@angular/core';
import { Action, select, Store } from '@ngrx/store';
import { first, Subject, switchMap, tap, filter, takeUntil, map} from 'rxjs';
import { PushActions } from '../ngrx/actions/beacon.actions';
import { LoadNodeChanges } from '../ngrx/actions/change.actions';
import { AppState } from '../ngrx/reducers';
import { SSSAccountService } from './sss-account.service';
import { SSSMutateAuthService } from './sss-mutate.anon.service/sss-mutate.auth.service';
import { Command, DeleteData, Template } from '../models';
import { RegisterDroppable, ReloadTab } from '../ngrx/actions/tab.actions';
import { SSSMutateAnonService } from './sss-mutate.anon.service/sss-mutate.anon.service';
import { DraggedItem } from '@ng-dnd/sortable';
import { SSSTabService } from './sss-tab.service';
import { getTabs } from '../ngrx/selectors/graph.selector';

@Injectable({
  providedIn: 'root'
})
export class SSSDragDropService {

    public dndHovered$ 					: Subject<string> = new Subject();
	public previousHoverId 				: string;
    public previousHoverIndex 			: number;
	public previousDropDestinationId	: string;
    public previousDropIndex 			: number;
	public previousDropPointer 			: Pointer;

	private sssAcountService  			= inject(SSSAccountService);
	private sssMutateAuthService 		= inject(SSSMutateAuthService);
	private sssMutateAnonService 		= inject(SSSMutateAnonService);
	private sssTabService 				= inject(SSSTabService);
	private store 						= inject(Store<AppState>);

	onHoveredAnotherItem(tabId: string, _destroy$: Subject<boolean>){
		return this.dndHovered$.pipe(
			filter(itemId => itemId != tabId),
			takeUntil(_destroy$),
		)
	}

    drop( item: DraggedItem<Ancestry>, pagidx ): void {

		if( this.isSameDropSpot( item ) ) { return; } // protect against double drop

		this.previousDropDestinationId = item.hover.listId;
		this.previousDropIndex = item.hover.index;
		this.previousDropPointer = item.data.pointer;

		this.dndHovered$.next(item.hover.listId);

		const ancestry 				= item.data;
		const from					= item.index
		const to 					= item.hover.index;
		const destinationTabId 		= item.hover.listId;
		const destinationNodeId 	= this.sssTabService.deriveNodeFromTabid( item.hover.listId );
		const sourceTabId 			= ancestry.parentTabid;

		if( sourceTabId == destinationTabId && from == to ) { return; } // has not moved
		
		switch(true) {

			case this.isForeign(item) 	: this.moveForeign( from, to, destinationTabId, destinationNodeId, ancestry, pagidx); break;
			case this.isDomestic(item) 	: this.moveDomestic(from, to, destinationTabId, destinationNodeId, ancestry, pagidx); break;
		}
	}

	moveDomestic( from: number, to: number, tabid: string, nodeid: string, ancestry: Ancestry, pagidx: number ): void {
						
		this.toggle(ancestry, true);

		if( this.sssAcountService.determineIfLoggedIn() ) {
			
			this.toggle(ancestry, true);

			this.store.pipe( 	
				first(),
				select(getTabs), 
				map( (tabHash: { [ tabid: string ]: Tab[] } ) => tabHash[ ancestry.parentTabid ][0] ),
				switchMap( (fromTab: Tab ) => 
					this.sssMutateAuthService.triggerMove(from, to, fromTab.revision, ancestry.pointer, ancestry.parentTabid) 
				),
				tap((res: { actions: Action[] }) => { this.store.dispatch( PushActions ({ payload: res.actions})) })

			).subscribe(res => this.toggle(ancestry, false) );

		} else {

			const transaction = LoadNodeChanges( { payload: { [ nodeid ] : new Command("MOVE", new MoveData(from, to, ancestry.pointer), tabid ) } } );

			this.toggle(ancestry, false);

			this.store.dispatch(PushActions( { payload: transaction } ) );
		}
	}

	validateForeignExchange(destinationTabId: string, sourceTabId: string): boolean {

		const valid = this.sssTabService.isSibling( sourceTabId, destinationTabId );

		if(!valid) { this.store.dispatch(PushActions( { payload: [ ReloadTab( { payload: { id: destinationTabId, origin: "validateForeignExchange"} } ), ReloadTab( { payload: { id: sourceTabId, origin: "validateForeignExchange"} } ) ] } ) )}
		
		return valid;  // cannot drop in the same sister tab root so have to call ReloadTab to cancel out temp inventory changes in component
	}

	moveForeign( from: number, to: number, destinationTabId: string, destinationNodeId: string, ancestry: Ancestry, pagidx: number ): void {

		if( this.validateForeignExchange(destinationTabId, ancestry.parentTabid) ) { return; }
			
		this.toggle(ancestry, true);

		if( this.sssAcountService.determineIfLoggedIn() ) {

			this.store.pipe( 	
				first(),
				select(getTabs), 
				map( (tabHash: { [ tabid: string ]: Tab[] } ) => tabHash[ ancestry.parentTabid ][0] ),
				switchMap( (fromTab: Tab ) => 
					this.sssMutateAuthService.triggerMove(from, to, fromTab.revision, ancestry.pointer, ancestry.parentTabid, destinationTabId) 
				),
				tap((res: { actions: Action[] }) => { this.store.dispatch( PushActions ({ payload: res.actions})) })

			).subscribe(res => this.toggle(ancestry, false) )

		} else {

			const transaction = [
				LoadNodeChanges ( { payload: { [ destinationNodeId ]		: new Command("INJECT", new InjectData( ancestry.pointer, to), destinationTabId) } } ),
				LoadNodeChanges ( { payload: { [ ancestry.parentNodeid ]	: new Command("DELETE", new DeleteData( ancestry.pointer, from ), ancestry.parentTabid ) } } ),
			];

			this.toggle(ancestry, false);

			this.store.dispatch( PushActions( { payload: transaction } ) );
		}
	}

	toggle(ancestry: Ancestry, state: boolean) {

		// ancestry.pointer.loading = state;

		this.sssMutateAnonService.triggerUpdate( ancestry, { disabled: state } );
	}

	registerDroppable(tabid: string, template: Template, state: boolean): void {

		if( template.droppable ) {

			this.store.dispatch(PushActions( { payload: RegisterDroppable( { payload: { tabid, state } } ) } ) );
		}
	}

	isSameDropSpot(item: DraggedItem<Ancestry>): boolean {
		
		return 	this.previousDropDestinationId		== item.hover.listId 			&&
				this.previousDropIndex 				== item.hover.index 			&&
				this.previousDropPointer?.instance 	== item.data.pointer.instance 	&&
				this.previousDropPointer?._id 		== item.data.pointer._id;
	}

	isDifferentHoverSpot(item: DraggedItem<Ancestry>): boolean {
		return this.previousHoverId && this.previousHoverId != item.hover.listId
	}

	isDomestic(item: DraggedItem<Ancestry>): boolean {
		return item.hover.listId == item.listId;
	}

	isForeign(item: DraggedItem<Ancestry>): boolean {
		return item.hover.listId != item.listId;
	}

	checkIfDragging(ground, inFlight): boolean {
		return 	this.sssTabService.deriveTabidFromPointer(ground.pointer, 0) ===
				this.sssTabService.deriveTabidFromPointer(inFlight.data.pointer, 0);
	}
}
