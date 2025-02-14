import { SSSListenerService } from './sss-listener.service';
import { Ancestry } from '../models/ancestry';
import { Injectable, inject } from '@angular/core';
import { Store, select, Action } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { getListeners, getNodeById, getTabById } from '../ngrx/selectors/graph.selector';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, switchMap, withLatestFrom, map } from 'rxjs/operators';
import { SSSTabService } from './sss-tab.service';
import { Tab, Node, Pointer, Command } from '../models';
import * as _ from 'lodash';
import { SSSChangeService } from './sss-change.service';
import { ChangeWrapper } from '../models/change-wrapper';
import { Subscription } from '../models/subscription';
import { SSSAncestryService } from './sss-ancestry.service';
import { getChangeByNodeId, getChangeByTabId, getTempChangeByTabId } from '../ngrx/selectors/change.selector';
import { SSSSisterService } from './sss-sister.service';
import { SSSNodeService } from './sss-node.service';

@Injectable({
  providedIn: 'root'
})
export class SSSSelectorService {

	private store 					= inject(Store<AppState>);
	private sssChangeService  		= inject(SSSChangeService);
	private sssAncestryService  	= inject(SSSAncestryService);
	private sssListenerService 		= inject(SSSListenerService);
	private sssTabService 			= inject(SSSTabService);
	private sssSisterService 		= inject(SSSSisterService);
	private sssNodeService 			= inject(SSSNodeService);

	public generateNodeSubscriptionObj(id: string, ancestry: Ancestry): Subscription { return new Subscription ( id, ancestry ); }

	public generateTabSubscriptionObj(id: string, ancestry: Ancestry): Subscription { return new Subscription ( id, ancestry ); }

	public registerNode(subscription: { id: string }, ancestry: Ancestry, _destroy$: Subject<boolean>): Observable<Node> {

		const alreadyComandeered 	= this.sssNodeService.getComandeeredFromHash( ancestry.pointer._id );
		const pointer 				= {...ancestry.pointer, name: alreadyComandeered || ancestry.pointer._id };
		subscription.id  			= alreadyComandeered || ancestry.pointer._id;
		// urlPath use case may have comandeered a nodeid before
		// other sibling components in the tree first instantiate

		this.sssNodeService.addToHash(subscription.id);

		this.sssSisterService.addSistersToList( ancestry );

		return this.generateNodeSelector(subscription, pointer, _destroy$);
	}

	public registerTab(subscription: { id: string }, _destroy$: Subject<boolean>): Observable<Tab> {

		return this.generateTabSelector(subscription, _destroy$);
	}

	public comandeerNode(subscription: Subscription, oldId: string, newId: string, newAncestry : Ancestry, oldAncestry : Ancestry): void {

		this.sssNodeService.addToHash(newId);

		this.sssSisterService.addSistersToList( this.sssAncestryService.comandeerAncestry(newAncestry) );

		subscription.id = newId;

		subscription.ancestry = newAncestry;

		this.sssNodeService.removeFromHash(oldId);

		this.sssSisterService.removeSistersFromList( oldAncestry );
	}

	public comandeerTab(subscription: Subscription, newTabid: string, ancestry: Ancestry): void {

		subscription.id = newTabid

		subscription.ancestry = this.sssAncestryService.comandeerAncestry(ancestry);;
	}

	public unregisterNode(_destroy$: Subject<boolean>, id: string) {

        _destroy$.next(null);
		_destroy$.complete();
		
		this.sssNodeService.removeFromHash(id);
	}

	public selectNodeChanges(subscription: Subscription, _destroy$: Subject<boolean>): Observable<Action[]> {

		return this.store.pipe(

			takeUntil(_destroy$),
			select(getChangeByNodeId(subscription)),
			filter(		(command: Command) => !!command),
			filter(		(command: Command) => !!this.sssTabService.isBranch( subscription.ancestry.pointer )),
			map( 	 	(command: Command) => ({ command, candidateTabid: this.sssTabService.deriveTabidFromPointer(subscription.ancestry.pointer, 0) })),
			filter(		({command, candidateTabid}) => !!this.sssTabService.isSimilarInstance( candidateTabid, command.tabid )),
			switchMap(	({command, candidateTabid}) => this.sssChangeService.fetchChangeActions( candidateTabid, command, subscription.ancestry))
		)
	}

	public selectTabChanges(subscription: Subscription, pagidx: number, _destroy$: Subject<boolean>): Observable<Action[]> {

		return this.store.pipe(

			takeUntil(_destroy$),
			select(getChangeByTabId(subscription)),
			filter((changes: ChangeWrapper) => !!changes ),
			switchMap((changes: ChangeWrapper) => this.sssChangeService.processChanges( subscription.ancestry, pagidx, changes ))
		)
	}

	public selectTempChanges(subscription: Subscription, _destroy$: Subject<boolean>): Observable<Command> {

		return this.store.pipe(

			takeUntil(_destroy$),
			select(getTempChangeByTabId(subscription)),
			filter((changes: Command) => !!changes )
		)
	}
  
	private generateNodeSelector(subscription: { id: string }, pointer: Pointer, _destroy$: Subject<boolean>): Observable<Node> {

		return this.store.pipe(
			takeUntil(_destroy$),
			select(getNodeById(subscription)),
			withLatestFrom(this.store.select(getListeners)),
			filter(([node, listeners]) => {

				const alreadyListening = this.sssListenerService.determineIfAlreadyListening( pointer, listeners );

				const noIdChange = node && pointer._id == node._id;

				return !(noIdChange && alreadyListening);
			}),

			map(([node]) => node )
		);
	}

	private generateTabSelector(subscription: { id: string }, _destroy$: Subject<boolean>): Observable<Tab> {

		return this.store.pipe(
			takeUntil(_destroy$),
			select(getTabById(subscription))
		);
	}
}
