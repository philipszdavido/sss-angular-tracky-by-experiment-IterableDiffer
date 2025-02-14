import { Tab } from '../models/tab';
import { Node } from '../models/node';
import { Injectable, inject } from '@angular/core';
import { Pointer } from 'src/app/models/pointer';
import { SSSLocalService } from './sss-local.service';
import * as _ from 'lodash';
import * as merge from 'deepmerge';
import { Store } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { PushActions } from '../ngrx/actions/beacon.actions';
import { LoadTab } from '../ngrx/actions/tab.actions';
import { LoadNode } from '../ngrx/actions/node.actions';
import { SwapChanges } from '../ngrx/actions/change.actions';
import { SSSNodeService } from './sss-node.service';
import { SSSAccountService } from './sss-account.service';

@Injectable({
  	providedIn: 'root'
})
export class SSSTabService {

	private sssLocalService = inject(SSSLocalService);
	private sssAccountService = inject(SSSAccountService);
	private store = inject(Store<AppState>);
	private sssNodeService = inject(SSSNodeService);

	getTabid( pointer: Pointer ): string {

		const { _id, pagination, instance, currenttab, currentdate } = pointer;

		const namespace = currenttab == "day" ? currentdate : 'ALLRESOURCES';

		return `${_id}_${namespace}_${pagination[0].serial}_${instance}`;
	}

	deriveNamespaceTail( tabid: string ) : string { return tabid.split("_").slice(-3)[0]; }

    deriveInstanceFromTabid( tabid: string ) : string { return tabid.split("_").pop(); }

	derivePagination( tabid: string ) : string { return tabid.split("_").slice(-2)[0]; }

	deriveUsername( tabid: string ) : string { return tabid.split("_")[0]; }

	derivePagIdx( pointer: Pointer, tabid: string ) {

        return pointer.pagination[ 0 ].serial == this.derivePagination( tabid ) ? 0 : 1;
	}

    deriveTabidFromPointer( pointer: Pointer, idx: number ) : string {

        if( !pointer.pagination[ idx ] ) { return null; }
        return pointer._id + "_" +
               this.decipherTailNameSpaceByPointer( pointer ) + "_" +
               pointer.pagination[ idx ].serial + "_" +
               pointer.instance;
	}

	deriveSerialFromTabId(tabid: string): string {

        return tabid.split("_").at(-2);
	}

    decipherTailNameSpaceByPointer ( pointerobj : Pointer ) : string {

        switch( pointerobj.currenttab ) {

			case "month-cell"	: return String(pointerobj.currentdate);
            case "day"          : return String(pointerobj.currentdate);
            case "timeline"     : return "TIMELINE";
            default             : return "ALLRESOURCES";
        }
	}

    interchangeNodeFromTab( tabid : string, newNodeid : string ): string {

        const returnArray = tabid.split("_").slice(-3);

        returnArray.unshift( newNodeid );

		return returnArray.join("_");
    }

    interchangePaginationFromTab( tabid : string, pagination : string ): string {

        const returnArray = tabid.split("_");

        returnArray.splice(-2, 1, pagination);

		return returnArray.join("_");
    }

    interchangeInstanceFromTab( tabid : string, instance : string ): string {

        const returnArray = tabid.split("_").slice(0, -1);

        returnArray.push( instance );

		return returnArray.join("_");
    }

    isBranch( ...argarray ) {

        let leaftabtypearray = [ "vacant",
                                 "stub",
                                 "edit",
                                 "tags",
                                 "menu",
                                 "coin",
                                 "headline",
                                 "marquee",
                                 "button",
                                 "destinations",
                                 "modal",
                                 "calendar",
                                 "basic" ];

        const arg = typeof argarray[0] == "string" ? argarray[0] : argarray[0].currenttab;

        return leaftabtypearray.indexOf( arg ) == -1;
	}   // A BRANCH IS TRUE IF IT IS NOT ON THIS LIST


    isToday( ...argarray ) {

        if( typeof argarray[0] != "string") { // pointer

            if( !argarray[0].currentdate || argarray[0].currenttab != "day" ) { return false; }

            return this.isToday( this.deriveTabidFromPointer( argarray[0], 0 ) );
        }

        const todayDate     = new Date().setHours(12,0,0,0);
        const namespaceTail = parseInt( this.deriveNamespaceTail( argarray[0] ) ); // tabid

        return todayDate == namespaceTail;
	}

    interpretTabid( tabid: string ): {
		nodeid: string,
		namespace: string,
		pagination: string,
		instance: string
	  } {

        const itp           = tabid.split("_");

        return {
            nodeid          : itp.slice(0,-3).join("_"),
            namespace       : itp.slice(-3)[0],
            pagination      : itp.slice(-2)[0],
            instance        : itp.slice(-1)[0]
        }
	}

	hasBeenComandeered(tabid: string): boolean {

		const prefix 	= this.deriveUsername(tabid);
		const username  = this.sssAccountService.getUser()._id;

		return prefix == username;
	}

	processContribution(tab: Tab, additions): Tab | void {

		switch( true ) {
			case this.isTimeline( tab._id )	: return  this.processTimelineAdditions( tab, additions, new Date() );
			case this.isDay( tab._id ) 		: return  this.processDayAdditions(      tab, additions );
			default							: return  this.processNormalAdditions(   tab, additions );
		}
	}

	refreshTabPagination( tabobj, tabid ): Tab {

        if( !this.sssAccountService.determineIfLoggedIn() ) {

            if( tabobj.antes ) {  tabobj.antes.ghoul = _.get( tabobj, 'antes.ghost' ) ||
                                                       _.get( tabobj, 'antes.ghoul' ) ||
                                                       this.deriveNodeFromTabid( tabid );

                                    tabobj.antes = _.omit(tabobj.antes, 'ghost'); }

            if( tabobj.despues ) {  tabobj.despues.ghoul = _.get( tabobj, 'despues.ghost' ) ||
                                                           _.get( tabobj, 'despues.ghoul' ) ||
                                                           this.deriveNodeFromTabid( tabid );

                                    tabobj.despues = _.omit(tabobj.despues, 'ghost'); }
        }                           // omit bc of elvis issues of tabobjs w/o antes or despues key

        return tabobj;
    }

	processNormalAdditions( tab: Tab, additions: Pointer[] ): Tab {

        // this.sssLocalService.removeObjByKey( tab._id );

		tab = merge.all( [ tab, { _id : this.comandeerId( tab._id ) } ] ) as Tab;

		tab = this.refreshTabPagination( tab, tab._id );

		return additions.reduce( (accum: Tab, pointer: Pointer) => ( { ...accum, inventory: [ pointer, ...accum.inventory ] } ), tab);
	}

	comandeerId = ( old_id: string ) : string => {

		const splitarray  = old_id.split("_");
		const username    = this.sssAccountService.getUser()._id;

		if( splitarray[0] == username ) { return old_id; }

		splitarray.length < 5 	? splitarray.unshift( username )
								: splitarray.splice( 0, 2, username, `${splitarray[0]}@${splitarray[1]}` );

		return splitarray.join("_");
	}

    processDayAdditions( tab: Tab, additions: Pointer[] ) {

        const okToMutate       = this.isToday( tab._id ) && this.derivePagination( tab._id ) == "primero";
        const intendedAddition = okToMutate ? additions : [];

        return this.processNormalAdditions( tab, intendedAddition );
    }

    processTimelineAdditions( tab: Tab, additions: Pointer[], date: Date ): Tab | void {

		const dayOfAdditions				= date.setHours(12,0,0,0);
		const mostRecentPointer   			= tab.inventory[0];

		return !mostRecentPointer || dayOfAdditions != mostRecentPointer.currentdate
			? this.processNewDay( dayOfAdditions, tab, additions )
			: this.processExistingDay(mostRecentPointer, tab, additions);
	}

	processNewDay( dateOfDay: number, tab: Tab, additions: Pointer[] ): Tab {
		const instance   		= this.deriveInstanceFromTabid( tab._id );
		const nodeid			= this.deriveNodeFromTabid( tab._id );
		const newPointer 		= this.createNewPointer( "calendar", nodeid, "card", dateOfDay, instance, "basic" );
		const day        		= this.generateDayElements( newPointer );

		tab.inventory.unshift( newPointer );

		const transaction 		= [
			LoadTab( 			{ payload: { id: day._id, tab: day, origin: "processNewDay" } } ),
            LoadTab( 			{ payload: { id: tab._id, tab: tab, origin: "processNewDay" } } ),
			SwapChanges( 		{ payload: { cutid: tab._id, newList: { [ day._id ] : { additions } } } } )
		]

		this.store.dispatch( PushActions( { payload: transaction } ) );

		return tab;
	}

	processExistingDay(mostRecentPointer: Pointer, tab: Tab, additions: Pointer[]): void {

		const tabid  = this.deriveTabidFromPointer(  mostRecentPointer, 0  );
		const action = SwapChanges( { payload: { cutid: tab._id, newList: { [ tabid ] : { additions } } } } );

		this.store.dispatch( PushActions( { payload: action } ) );
	}

    generateDayElements( newPointer: Pointer ): Tab {

		const 	new_tabid 			= this.deriveTabidFromPointer( newPointer, 0 );

        const { vacantnodeobj,
				stubnodeobj,
				calendartabobj } 	= this.assembleNewCalendarTabObject( new_tabid );

		const 	transaction			= [

				LoadNode( { payload: { id: vacantnodeobj._id, 	node: vacantnodeobj } } ),
				LoadNode( { payload: { id: stubnodeobj._id, 	node: stubnodeobj } } )
		];

		this.store.dispatch( PushActions( { payload: transaction } ) );

        return calendartabobj;
    }

    createNewPointer( typearg: string, name, optionaltabarg: string, optionaldatearg, instance, defaultchildrenstate ): Pointer {

        let currenttab, currentdate;

        if ( typearg === "calendar" ) {

            currenttab     = optionaltabarg === "card" ? "day" : optionaltabarg || "day";
            currentdate    = optionaldatearg || this.createTodayUTC();

        } else {

            currenttab     = optionaltabarg === "card" ? "all" : optionaltabarg || "all";
            currentdate    = optionaldatearg || null;
        }

        return new Pointer( currenttab, currentdate, instance, name, "basic" /* defaultchildrenstate */ );
	}

	deriveNodeFromTabid( tabid : string ) {

        const splitarray = tabid.split("_")

        splitarray.splice(-3, 3);

		return splitarray.join("_");
    }

	isTimeline(input: string): boolean {
		return this.deriveNamespaceTail( input ) == "TIMELINE";
	}

    isDay( ...argarray ): boolean {

		const namespacetail = typeof argarray[0] != "string"
								? argarray[0].currentdate  					// pointer
								: this.deriveNamespaceTail( argarray[0] ); 	// tabid

        return !isNaN( parseInt( namespacetail ) );
	}

	assembleNewCalendarTabObject( tabid: string ): { vacantnodeobj: Node, stubnodeobj: Node, calendartabobj: Tab } {

		const username 			= this.sssAccountService.getUser()._id;
        const vacantNodeId 		= (username === "mysyllabi" ? "HHHHHHHH-" : username + "_HHHHHHHH-") + Date.now();
		const stubNodeId 		= (username === "mysyllabi" ? "GGGGGGGG-" : username + "_GGGGGGGG-") + Date.now();
		const vacantnodeobj   	= new Node(vacantNodeId, "blue", "", "vacant");
		const stubName 			= ( new Date( parseInt( this.createTodayUTC() ) ) ).toDateString();
		const stubnodeobj     	= new Node(stubNodeId, "blue", stubName, "stub");
        const calendartabobj 	= new Tab( tabid );
		const vacantpointerobj	= new Pointer("vacant", null, ( Date.now() ).toString(), vacantNodeId);
		const stubpointerobj 	= new Pointer("stub", null, ( Date.now() ).toString(), stubNodeId);

        calendartabobj.inventory.push( vacantpointerobj );
        calendartabobj.inventory.push( stubpointerobj );

        return { vacantnodeobj, stubnodeobj, calendartabobj };
	}

    createTodayUTC() {

        let nowDate = new Date();

        return Date.UTC( nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1 ).toString();
	}

	replaceTab( tabs: { [key: string]: Tab[] }, { oldTabId, newTabObj } ) : { [key: string]: Tab[] } {

		return { ...tabs, [ newTabObj._id ] : [ newTabObj ], [ oldTabId ] : [ newTabObj ] };
	}

	removeTab( tabs: { [key: string]: Tab[] }, outgoingId: string ) : { [key: string]: Tab[] } {

		const _tabs =  tabs[ outgoingId ].length > 1
			? { ...tabs, [ outgoingId ]: tabs[ outgoingId ].slice(0, 1) }
			: Object.fromEntries(
				Object.entries(tabs).filter(([key]) => key !== outgoingId)
			);

		return _tabs
	}

	findPointerIndex(tabobj: Tab, pointer: Pointer): number {

		return tabobj.inventory.findIndex(el =>
			`${el.currentdate || ''}_${el.instance}_${el._id}` ==
			`${pointer.currentdate || ''}_${pointer.instance}_${pointer._id}`
		);
	}

	validatePointerAtIndex(tabobj: Tab, pointer: Pointer, idx: number): boolean {

		const tally = tabobj.inventory.reduce((accum, el, idx) => {

			return 	`${el.currentdate || ''}_${el._id}` == `${pointer.currentdate || ''}_${pointer._id}`
						? [...accum, idx] : accum;
		}, []);

		return tally.indexOf(idx) != -1;
	}

	replacePointer(tabs: { [key: string]: Tab[] }, { id, pointer, comandeer, origin } ): { [key: string]: Tab[] } {

		if(!!tabs[ this.comandeerId( id ) ]) { id = this.comandeerId( id ) } // if already comandeered then use it so not to overwrite

		const mutated = merge.all([ tabs[ id ][0] ]) as Tab;

		const idx = this.findPointerIndex( mutated, pointer );

		if( idx != -1 ) { /*** CANDIDATE FOR PERFORMANCE OPTMIZATION ***/
			mutated.inventory[ idx ] = { ...mutated.inventory[ idx ], _id: this.sssNodeService.comandeerId( pointer._id ) };
		}

		switch (true) {
			case _.isEqual(mutated, tabs[id][0]): return tabs;
			case comandeer:
			return this.replaceTab(tabs, { oldTabId: id, newTabObj: { ...mutated, _id: this.comandeerId( id ) } });
			default:
			return { ...tabs, [ id ]: [ mutated ] };
		}

	}

	updatePointer(tabs: { [key: string]: Tab[] }, { ancestry, changes}): { [key: string]: Tab[] } {

		if( !tabs[ ancestry.parentTabid ] ) { throw "Update Pointer Error" }

		const mutated = merge.all([ tabs[ ancestry.parentTabid ][0] ]) as Tab;

		const idx = this.findPointerIndex( mutated, ancestry.pointer );

		mutated.inventory[ idx ] = { ...mutated.inventory[ idx ], ...changes };

		return { ...tabs, [ ancestry.parentTabid ] : [ mutated ] };
	}

	isSimilarInstance(tabIdA: string, tabIdB: string) : boolean {

		const { nodeid: nodeidA, namespace: namespaceA, pagination: paginationA } = this.interpretTabid( tabIdA );
		const { nodeid: nodeidB, namespace: namespaceB, pagination: paginationB } = this.interpretTabid( tabIdB );

		return 	nodeidA 	=== nodeidB 	&&
				namespaceA 	=== namespaceB 	&&
				paginationA === paginationB;
	}

	isSibling(tabIdA: string, tabIdB: string) : boolean {

		return 	this.deriveNamespaceTail(tabIdA) == this.deriveNamespaceTail(tabIdB) &&
				this.deriveNodeFromTabid(tabIdA) == this.deriveNodeFromTabid(tabIdB)
	}

	loadTabs( tabs: { [key: string]: Tab[] }, incoming: { [key: string] : Tab[] } ) : { [key: string]: Tab[] } {

		return Object.keys(incoming).reduce((updatedTabs, tabid) => {
			updatedTabs[tabid] = updatedTabs[tabid]
					? [ ...incoming[tabid], ...updatedTabs[tabid] ]
					: incoming[tabid];
			return updatedTabs;
		}, { ...tabs });
	}

	loadTab( tabs: { [key: string]: Tab[] }, id: string, tab: Tab, origin: string ) : { [key: string]: Tab[] } {

		return { ...tabs, [ id ] : [ tab ] };
	}

	reloadTab( tabs: { [key: string]: Tab[] }, tabId: string, origin: string ) : { [key: string]: Tab[] } {

		tabId = tabs[ tabId ] ? tabId : this.comandeerId(tabId)

		return tabs[ tabId ] ? { ...tabs, [ tabId ] : _.cloneDeep( tabs[ tabId ] ) } : tabs;
	}
}
