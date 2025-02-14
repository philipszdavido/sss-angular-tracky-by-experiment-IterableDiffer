import { inject, Injectable } from '@angular/core';
import { Node } from '../models';
import * as merge from 'deepmerge';
import * as _ from 'lodash';
import { RemoveNode } from '../ngrx/actions/node.actions';
import { PushActions } from '../ngrx/actions/beacon.actions';
import { Store } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { SSSLocalService } from './sss-local.service';
import { SSSAccountService } from './sss-account.service';

@Injectable({
  providedIn: 'root'
})
export class SSSNodeService {

	public nodeHash: { [key: string]: number } = {};

	private store 					= inject(Store<AppState>);
	private sssAccountService 		= inject(SSSAccountService);
	protected sssLocalService		= inject(SSSLocalService);

	public comandeerId = ( old_id: string ) : string => {

		const username 	  = this.sssAccountService.getUser()._id;
		const splitarray  = old_id.split("_");

		if( splitarray[0] == username ) { return old_id; }

		splitarray.length < 2 	? splitarray.unshift( username )
								: splitarray.splice( 0, 2, username, `${splitarray[0]}@${splitarray[1]}` );

		return splitarray.join("_");
	}

	public comandeerNode(nodes: { [key: string]: Node[] }, oldNodeId: string ) : { [key: string]: Node[] } {

		if(!nodes[ oldNodeId ]) { return nodes; }

		const newNodeObj = { ...nodes[ oldNodeId ][0], _id: this.comandeerId( oldNodeId ) };

		return this.replaceNode(nodes, { oldNodeId, newNodeObj })
	}

	public replaceNode( nodes: { [key: string]: Node[] }, { oldNodeId, newNodeObj } ) : { [key: string]: Node[] } {

		return { ...nodes, [ newNodeObj._id ] : [ newNodeObj ], [ oldNodeId ] : [ newNodeObj ] };
	}

	public updateNode( nodes: { [key: string]: Node[] }, { nodeid, changes } ) : { [key: string]: Node[] } {

		return { ...nodes, [ nodeid ] : [ merge.all( [ nodes[ nodeid ][0], changes ] ) ] };
	}

	public reloadNode( nodes: { [key: string]: Node[] }, nodeId: string ) : { [key: string]: Node[] } {

		return nodes[ nodeId ] ? { ...nodes, [ nodeId ] : _.cloneDeep( nodes[ nodeId ] ) } : nodes;
	}

	public loadNodes( nodes: { [key: string]: Node[] }, incoming: { [key: string] : Node[] } ) : { [key: string]: Node[] } {
		
		return Object.keys(incoming).reduce((updatedNodes, nodeid) => {
			updatedNodes[nodeid] = updatedNodes[nodeid]
					? [ ...incoming[nodeid], ...updatedNodes[nodeid] ]
					: incoming[nodeid]; 
			return updatedNodes;
		}, { ...nodes }); 
	}

	public removeNode( nodes: { [key: string]: Node[] }, outgoingId: string ) : { [key: string]: Node[] } {

		switch(true) {
			case !nodes[ outgoingId ]				: return nodes;
			case nodes[ outgoingId ].length > 1		: return { ...nodes, [ outgoingId ]: nodes[ outgoingId ].slice(0, 1) };
			default									: return _.omit( nodes, outgoingId );
		}
	}

	public getComandeeredFromHash( nodeid: string): string {

		const comandeered = this.comandeerId( nodeid )

		return this.nodeHash[ comandeered ] && comandeered;
	}

	public addToHash( _id: string ) {

		this.nodeHash[ _id ] = this.nodeHash[ _id ] ? ++this.nodeHash[ _id ] : 1;
	}

	public removeFromHash( id: string ): void {

		if( this.nodeHash[ id ] > 1 ) {

			--this.nodeHash[ id ];

		} else {

			delete this.nodeHash[ id ];

			this.store.dispatch(PushActions( { payload: RemoveNode( { payload: id } ) } ) );

			this.sssLocalService.removeObjByKey( id );
		}
	}
}
