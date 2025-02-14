import { Injectable, inject } from '@angular/core';
import { Ancestry } from '../models/ancestry';
import { SSSNodeService } from './sss-node.service';
import { SSSTabService } from './sss-tab.service';
import * as _ from 'lodash';
import { Tab, Pointer } from '../models';
import { SSSMonthService } from './sss-month.service';
import { merge } from 'immutable';
import { Store } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { SubstituteTab } from '../ngrx/actions/tab.actions';
import { PushActions } from '../ngrx/actions/beacon.actions';

@Injectable({
  providedIn: 'root'
})
export class SSSAncestryService {

	private sssNodeService 		= inject(SSSNodeService);
	private sssTabService 		= inject(SSSTabService);
	private sssMonthService 	= inject(SSSMonthService);
	private store 				= inject(Store<AppState>);

	comandeerAncestry(ancestry: Ancestry): Ancestry {

		ancestry = _.cloneDeep(ancestry);

		ancestry.pointer._id = this.sssNodeService.comandeerId(ancestry.pointer._id);

		ancestry = this.comandeerParents(ancestry);

		return ancestry;
	}

	comandeerParents(ancestry: Ancestry): Ancestry {

		ancestry = _.cloneDeep(ancestry);

		if( ancestry.parentTabid ) 	{ ancestry.parentTabid = this.sssTabService.comandeerId(ancestry.parentTabid); }

		if( ancestry.parentNodeid ) { ancestry.parentNodeid = this.sssNodeService.comandeerId(ancestry.parentNodeid); }

		return ancestry;
	}

	dispatchChildTabs(oldPointer: Pointer, newPointer: Pointer, hash: { [key: string]: Ancestry }) {

		const genKey = (pointer: Pointer): string => `${pointer._id}_${pointer.instance}_${pointer.currentdate || ""}`;

		if( this.sssTabService.isBranch(newPointer) ) {

			newPointer.pagination.forEach((pag, idx) => {

				const oldTabId 	= this.sssTabService.deriveTabidFromPointer(hash[genKey(oldPointer)]?.pointer, idx);
				const newTabId	= this.sssTabService.deriveTabidFromPointer(hash[genKey(oldPointer)]?.pointer, idx);

				this.store.dispatch( PushActions( { payload: SubstituteTab( { payload: { oldTabId, newTabId } } ) } ) );
			});
		}
	}

	getAncestryList(tab: Tab, shouldComandeer: boolean, ancestryList: Ancestry[], ancestry: Ancestry, pagIdx: number, override: Pointer = {}): Ancestry[] {

		const genKey = (pointer: Pointer): string => `${pointer._id}_${pointer.instance}_${pointer.currentdate || ""}`;
		const stripout = (pointer: Pointer): Pointer => _.omit(pointer, ["id", "_id", "disabled"]);

		const hash = (ancestryList || []).reduce( (accum, ancestry) => ({
			...accum,
			[genKey(ancestry.pointer)]: ancestry,
			[genKey(this.comandeerAncestry(ancestry).pointer)]: ancestry
		}), {} );

		return tab.inventory.filter((pointer: Pointer) => !!pointer).map((pointer: Pointer) => {

			const newPointer 			= {...pointer, ...override};
			const oldPointer 			= hash[genKey(pointer)]?.pointer;
			const isInsertedPointer 	= !oldPointer;
			const isJustComandeered 	= newPointer?._id != oldPointer?._id;
			const isTheSame 			= JSON.stringify(stripout(newPointer)) == JSON.stringify(stripout(oldPointer));
			const isPropertyChange 		= JSON.stringify(stripout(newPointer)) != JSON.stringify(stripout(oldPointer));

			switch(true) {
				case isInsertedPointer 	: 	console.log("isInsertedPointer", newPointer._id);
											return new Ancestry( _.cloneDeep(newPointer), tab._id, ancestry.pointer._id, Math.floor(100000 + Math.random() * 900000) );
				case isJustComandeered 	: 	console.log("isJustComandeered", newPointer._id);
											return new Ancestry( _.cloneDeep(newPointer), tab._id, ancestry.pointer._id, hash[genKey(pointer)].trackById );
				case isTheSame			:  	console.log("isTheSame", newPointer._id);
											return shouldComandeer ? this.comandeerParents(hash[genKey(pointer)]) : hash[genKey(pointer)];
				case isPropertyChange 	: 	console.log("isPropertyChange", newPointer._id);
											return new Ancestry( _.cloneDeep(newPointer), tab._id, ancestry.pointer._id, hash[genKey(pointer)].trackById );
			}

			throw `Unhandled getAncestryList Case Error: ${tab._id}`;
		});
	}

	getAncestryHash(tab: Tab, ancestry: Ancestry, pagIdx: number) {
		return tab.inventory.reduce((acc, pointer: Pointer) => {

			let dateString = this.sssMonthService.createDateString(new Date(pointer.currentdate));

			pointer = merge(pointer,{currenttab: "month-cell"});

			acc[dateString] = this.getAncestryForPointer(pointer, tab, ancestry);

			return acc;

		}, {});
	}

	getAncestryForPointer(pointer, tab: Tab, ancestry: Ancestry) {
		return new Ancestry(_.cloneDeep(pointer), tab._id, ancestry.pointer._id);
	}
}
