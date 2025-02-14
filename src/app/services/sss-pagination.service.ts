import { inject, Injectable } from "@angular/core";
import { Action, select, Store } from "@ngrx/store";
import { Observable, of } from "rxjs";
import { filter, first, map, switchMap, take, tap } from "rxjs/operators";
import { Ancestry, Pagination, Pointer, Tab } from "../models";
import { PushActions } from "../ngrx/actions/beacon.actions";
import { AppState } from "../ngrx/reducers";
import { getTabById } from "../ngrx/selectors/graph.selector";
import { SSSAccountService } from "./sss-account.service";
import { SSSApiService } from "./sss-api.service";
import { SSSMutateAnonService } from "./sss-mutate.anon.service/sss-mutate.anon.service";
import { SSSTabService } from "./sss-tab.service";

@Injectable({
  providedIn: 'root'
})

export class SSSPaginationService {

	private sssAccountService = inject(SSSAccountService);
	private sssTabService = inject(SSSTabService);
	private store = inject(Store<AppState>);
	private sssApiService = inject(SSSApiService);
	private sssMutateAnonService = inject(SSSMutateAnonService);

	proceedPagination( ancestry: Ancestry, direction: string ): void  {

		console.log(ancestry, direction);

		const pagIdx 	= direction == "antes" ? 0 : /* 'despues' */ ancestry.pointer.pagination.length - 1;
		const tabid 	= this.sssTabService.deriveTabidFromPointer( ancestry.pointer, pagIdx );

		const pagination$ = this.sssAccountService.determineIfLoggedIn()

			? 	of({ actions: [] })

			: 	this.proceedAnon( ancestry, direction, tabid )

		pagination$.pipe(take(1)).subscribe((res: { actions: Action[]}) => {
			this.store.dispatch( PushActions ( { payload: res.actions } ) )
		});
	}

	private proceedAnon( ancestry: Ancestry, direction: string, tabid: string ): Observable<{ actions: Action[] }> {

		return this.store.pipe(

			select( getTabById({ id : tabid }) ),
			first(),
			map((tab: Tab) =>
				[ this.generateTruePagination( ancestry.pointer, tab, direction ),
				  this.generateArtificialPagination( ancestry.pointer, tab, direction ) ]
			),
			tap(([truth, artificial]) => this.sssMutateAnonService.triggerUpdate( ancestry, { pagination: truth } )),
			filter(([truth, artificial]) => artificial.length > 0),
			switchMap(([truth, artificial]) => this.sssApiService.fetchBranch( { ...ancestry.pointer, pagination: artificial } ) )
		)
	}

	private generateTruePagination( pointer: Pointer, tab: Tab, direction: string ): Pagination[] {

		switch( true ) {

			case pointer.pagination.length === 2 && direction === "antes"						:
				return pointer.pagination.slice(0,1);

			case pointer.pagination.length === 1 && direction === "antes" && !tab.antes 		:
				return pointer.pagination;

			case pointer.pagination.length === 1 && direction === "antes"						:
				return [ tab.antes, ...pointer.pagination ];

			case pointer.pagination.length === 2 && direction === "despues"						:
				return pointer.pagination.slice(-1);

			case pointer.pagination.length === 1 && direction === "despues" && !tab.despues		:
				return pointer.pagination;

			case pointer.pagination.length === 1 && direction === "despues"						:
				return [ ...pointer.pagination, tab.despues ];
		}
	}

	private generateArtificialPagination( pointer: Pointer, tab: Tab, direction: string ): Pagination[] {

		switch( true ) {

			case pointer.pagination.length === 2	: return [];

			case direction === "antes"				: return !tab.antes 	? [] : [ tab.antes ];

			case direction === "despues"			: return !tab.despues 	? [] : [ tab.despues ];
		}
	}
}
