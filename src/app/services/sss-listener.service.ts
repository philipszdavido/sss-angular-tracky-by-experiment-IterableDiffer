import { Ancestry } from '../models/ancestry';
import { Injectable, PLATFORM_ID, Inject, inject } from '@angular/core';
import { Pointer, ListenerHash, Tab } from 'src/app/models';
import { SSSTabService } from './sss-tab.service';
import { Store } from '@ngrx/store';
import { RegisterListener, UnRegisterListener } from 'src/app/ngrx/actions/listener.actions';
import * as _ from 'lodash';
import { AppState } from 'src/app/ngrx/reducers';
import { isPlatformBrowser } from '@angular/common';
import { PushActions } from '../ngrx/actions/beacon.actions';
import * as merge from 'deepmerge';
import { SSSAncestryService } from './sss-ancestry.service';
import { SSSNodeService } from './sss-node.service';
import { SSSSisterService } from './sss-sister.service';


@Injectable({
  	providedIn: 'root'
})
export class SSSListenerService {

	private sssTabService 			= inject(SSSTabService);
	private sssAncestryService 		= inject(SSSAncestryService);
	private sssNodeService 			= inject(SSSNodeService);
	private sssSisterService 		= inject(SSSSisterService);
	private store					= inject(Store<AppState>);
	private platformId 				= inject(PLATFORM_ID);

	private blackList: string[] = [ "day", "stub" ]; // these cannot be registered as listener nor follower

	public register( ancestry: Ancestry ): void {

		if( !isPlatformBrowser(this.platformId) ) 	{ return; }

		if( this.blackList.indexOf(ancestry.pointer.currenttab) != -1 ) { return; } // ie days tabs are not processed

		if( !this.sssTabService.isBranch( ancestry.pointer ) ) { return; }
		
		this.store.dispatch(PushActions( { payload: RegisterListener( { payload: {ancestry, origin: "SSSListenerService"} } ) } ) );
	}

	public unregister( { pointer }: Ancestry ): void {

		if( !isPlatformBrowser(this.platformId) ) 	{ return; }

		if( !this.sssTabService.isBranch( pointer ) ) { return; }

		this.store.dispatch(PushActions( { payload: UnRegisterListener( { payload: { pointer, origin: "SSSListenerService" } } ) } ) );
	}

	public comandeer( ancestry: Ancestry ): void {

		this.unregister(ancestry);

		ancestry = ancestry.parentTabid ? this.sssAncestryService.comandeerAncestry(merge.all( [ancestry]) as Ancestry) : ancestry;
		
		this.register(ancestry);
	}

	public isFirstListener( stateListener: ListenerHash, ancestry: Ancestry ): boolean {

		const nodeid 	= ancestry.pointer._id;
		const namespace = this.sssTabService.decipherTailNameSpaceByPointer(ancestry.pointer);
		const instance  = ancestry.pointer.instance;

		return 	_.keys(_.get(stateListener, [nodeid, namespace], {})).length === 1 &&
				_.keys(_.get(stateListener, [nodeid, namespace], {}))[0] === instance;
	}

	private mockComandeerListeners( listeners: ListenerHash ): ListenerHash {

		return Object.keys(listeners).reduce((accum, nodeid) => {
			
			const comandeered = this.sssNodeService.comandeerId(nodeid);

			return merge.all([accum, { [comandeered]: listeners[nodeid] } ]) as ListenerHash;

		}, {});
	}

    public tabExistsInListenerHash( tabid: string, listeners: ListenerHash ): boolean {

        const { nodeid, namespace, instance } = this.sssTabService.interpretTabid( tabid ); 
		const mocked = this.mockComandeerListeners(listeners);

        return 	Object.keys( ( _.get( listeners, `${nodeid}.${namespace}.${instance}`) || {} ) ).length > 0 ||
				Object.keys( ( _.get( mocked, `${nodeid}.${namespace}.${instance}`) || {} ) ).length > 0;
	}

	public doesExactMatchExist(stateListener: ListenerHash, tabid: string): boolean {

		const { nodeid, namespace, instance } = this.sssTabService.interpretTabid(tabid);

		return Object.keys( ( _.get( stateListener, `${nodeid}.${namespace}.${instance}.${tabid}`) || {} ) ).length > 0;
	}

    private generateHash( tabid: string, ancestry: Ancestry ): ListenerHash {

        const nodeid 		= ancestry.pointer._id;
        const namespace		= this.sssTabService.deriveNamespaceTail( tabid );
        const instance 		= this.sssTabService.deriveInstanceFromTabid( tabid );
        const idx 			= this.sssTabService.derivePagIdx( ancestry.pointer, tabid )
        const pag 			= ancestry.pointer.pagination[ idx ];
        const ghoulghost 	= pag.ghoul || pag.ghost;
        const suffix 		= ghoulghost ? `:${ghoulghost}` : "";
        const datapoint 	= `false:${ancestry.pointer.defaultchildrenstate}${suffix}`;

		return { [ nodeid ]: { [ namespace ]: { [ instance ]: { [ tabid ]: { datapoint } } } } }
    }

	public pushListenerHash(stateListener: ListenerHash, ancestry: Ancestry, origin: string): ListenerHash {

		const tabid 		= this.sssTabService.deriveTabidFromPointer(ancestry.pointer, 0);
		const branch 		= this.sssTabService.isBranch(ancestry.pointer);
		const already 		= this.sssSisterService.isSisterAlreadyAListener(tabid, stateListener, this.mockComandeerListeners(stateListener));
		const match 		= this.doesExactMatchExist(stateListener, tabid);

		const listener 		= branch && ancestry.pointer.urlnodelistener;
		const follower 		= branch && already && !ancestry.pointer.urlnodelistener;

		const contribution  = !match && listener || follower ? this.generateHash(tabid, ancestry) : {};
		
		return merge.all( [ stateListener, contribution ] ) as ListenerHash;
	}

	private listenerExists(nameSpaceHash): boolean {

		for(let instancekey in nameSpaceHash) {

			for(let key in nameSpaceHash[ instancekey ]) {

				if( nameSpaceHash[ instancekey ][ key ].datapoint.split(':')[0] == 'true' ) {

					return true;
				}
			}
		}

		return false;
	}

	public popListener( listeners: ListenerHash, pointer: Pointer, origin: string ): ListenerHash {

		return pointer.pagination.reduce((accum, pag, idx) => {

			const tabid 	= this.sssTabService.deriveTabidFromPointer(pointer, idx);
			const nodeid 	= pointer._id;
			const namespace = tabid.split("_").slice(-3)[0];
			const instance  = tabid.split("_").slice(-1)[0];

			if( _.get( accum, `${nodeid}.${namespace}.${instance}` ) ) {

				delete accum[ nodeid ][ namespace ][instance][ tabid ];
			}

			if( !this.listenerExists( _.get( accum, `${nodeid}.${namespace}` ) ) ) {

				accum = _.omit( listeners, nodeid );
			}

			return accum;

		}, merge.all([listeners]) as ListenerHash);
	}

	public determineIfAlreadyListening( pointer: Pointer, listeners: ListenerHash): boolean {

		return pointer.pagination.reduce((accum, el, idx) => {

			const tabid = this.sssTabService.deriveTabidFromPointer(pointer, idx);

			const { nodeid, namespace, instance } = this.sssTabService.interpretTabid( tabid );

			return Object.keys( ( _.get( listeners, `${nodeid}.${namespace}.${instance}.${tabid}`) || {} ) ).length > 0;

		}, false);
	}
}
