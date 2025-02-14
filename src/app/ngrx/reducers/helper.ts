import { Action } from '@ngrx/store';
import { actionHash } from '../actions';
import * as _ from 'lodash';
import { Tab, Node, User, ListenerHash, Pointer, Ancestry, ChangeWrapper } from 'src/app/models';
import { SSSTabService } from "../../services/sss-tab.service";
import { SSSListenerService } from "../../services/sss-listener.service";
import { SSSNodeService } from 'src/app/services/sss-node.service';
import { AppInjector } from 'src/app/helpers/injector';

export const isEmptyArray = (input): boolean => {

	if( typeof input ==  "string" ) { return false; }

	return Array.isArray(input) && input.length == 0;
}

export const realizeAction = (action): Action => {

    if( action.slice ) { // indication that action comes from server or from websocket

		const { classString, slice, payload } = action;

        action = actionHash[ slice ][ classString ]( { payload } ); // even no arg is {} payload
    }

    return action;
};

const CHECK_LENGTH = 10;

export const validateBuffer = ( guard: (any /* Action */ | Action[])[] ): boolean => {

	if( guard.length != 100 ) { return true; }

	guard = guard.map((action, idx) => [...guard].splice( idx, CHECK_LENGTH ) )

	guard.sort();

	return !guard.filter((o, i) => ( JSON.stringify(o) === JSON.stringify( guard[i + 1] ) ) ).length; 
}// if zero length then true means it is valid

export const pushGuardBuffer = ( guard: (any /* Action */ | Action[])[], queue: (any /* Action */ | Action[])[] ): (any /* Action */ | Action[])[] => {

	guard = _.cloneDeep(guard);

	if( queue.length == 0 ) {

	} else if( guard.length < 100 ) {
		guard.push( JSON.stringify( realizeAction( queue[0][0] || queue[0] ) ) );
	} else {
		guard.shift();
		guard.push( JSON.stringify( realizeAction( queue[0][0] || queue[0] ) ) );
	}

	return guard;
}

export const deQueue = ( queue: (any /* Action */ | Action[])[] ) => {

    switch( true ) {

		case 	 queue.length == 0			: return  [];
        case     !Array.isArray( queue[0] ) : return  [...queue].slice(1);		// not a nested array
        case     !queue[0][1]				: return  [...queue].slice(1);		// last element in nested array
		case    !!queue[0][1]				: return [[...queue][0].slice(1),
														...queue.slice(1)];   	// existing elements still in nester array
        default								: throw "dq Error";
    }
}

export const comandeerNodeId = ( old_id: string ) : string => {

    return AppInjector.get(SSSNodeService).comandeerId( old_id );
}

export const comandeerNode = (nodes: { [key: string]: Node[] }, oldNodeId: string ) : { [key: string]: Node[] } => {

	return AppInjector.get(SSSNodeService).comandeerNode(nodes, oldNodeId );
}

export const replaceNode = ( nodes: { [key: string]: Node[] }, { oldNodeId, newNodeObj } ) : { [key: string]: Node[] } => {

	return AppInjector.get(SSSNodeService).replaceNode(nodes, { oldNodeId, newNodeObj } );
}

export const reloadNode = ( nodes: { [key: string]: Node[] }, nodeId: string ) : { [key: string]: Node[] } => {

	return AppInjector.get(SSSNodeService).reloadNode(nodes, nodeId );
}

export const loadTab = ( tabs: { [key: string]: Tab[] }, id: string, tab: Tab, origin: string ) : { [key: string]: Tab[] } => {

	return AppInjector.get(SSSTabService).loadTab(tabs, id, tab, origin );
}

export const reloadTab = ( tabs: { [key: string]: Tab[] }, tabId: string, origin: string ) : { [key: string]: Tab[] } => {

	return AppInjector.get(SSSTabService).reloadTab(tabs, tabId, origin );
}

export const loadNodes = ( nodes: { [key: string]: Node[] }, incoming: { [key: string] : Node[] } ) : { [key: string]: Node[] } => {

	return AppInjector.get(SSSNodeService).loadNodes(nodes, incoming );
}

export const removeNode = ( nodes: { [key: string]: Node[] }, outgoingId: string ) : { [key: string]: Node[] } => {

	return AppInjector.get(SSSNodeService).removeNode(nodes, outgoingId );
}

export const updateNode = ( nodes: { [key: string]: Node[] }, { ancestry, changes } ) : { [key: string]: Node[] } => {

	return AppInjector.get(SSSNodeService).updateNode(nodes, { nodeid: ancestry.pointer._id, changes } );
}

export const replacePointer = (tabs: { [key: string]: Tab[] }, { id, pointer, comandeer, origin } ): { [key: string]: Tab[] } => {

	return AppInjector.get(SSSTabService).replacePointer(tabs, { id, pointer, comandeer, origin } );
}

export const updatePointer = (tabs: { [key: string]: Tab[] }, { ancestry, changes } ): { [key: string]: Tab[] } => {

	return AppInjector.get(SSSTabService).updatePointer(tabs, { ancestry, changes } );
}

export const replaceTab = ( tabs: { [key: string]: Tab[] }, { oldTabId, newTabObj } ) : { [key: string]: Tab[] } => {

	return AppInjector.get(SSSTabService).replaceTab(tabs, { oldTabId, newTabObj } );
}

export const loadTabs = ( tabs: { [key: string]: Tab[] }, incoming: { [key: string] : Tab[] } ) : { [key: string]: Tab[] } => {

	return AppInjector.get(SSSTabService).loadTabs( tabs, incoming );
}

export const removeTab = ( tabs: { [key: string]: Tab[] }, outgoingId: string ) : { [key: string]: Tab[] } => {

	return AppInjector.get(SSSTabService).removeTab( tabs, outgoingId );
}

export const AddToListenerHash = (stateListener: ListenerHash, ancestry: Ancestry, origin: string): ListenerHash => {

	return AppInjector.get(SSSListenerService).pushListenerHash(stateListener, ancestry, origin);
}

export const removeFromListener = ( listeners: ListenerHash, pointer: Pointer, origin: string ): ListenerHash => {

	return AppInjector.get(SSSListenerService).popListener(listeners, pointer, origin);
}
