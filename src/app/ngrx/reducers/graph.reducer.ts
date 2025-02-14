import { SubstituteAppNode } from './../actions/application.actions';
import {
	LoadFetched as LoadFetchedNodes,
	LoadNode,
	ReloadNode,
	SubstituteNode,
	RemoveNode,
	UpdateNode} from './../actions/node.actions';
import { Action, createReducer, on } from '@ngrx/store';
import {
	replacePointer,
	replaceTab,
	comandeerNode,
	comandeerNodeId,
	removeFromListener,
	AddToListenerHash,
	updateNode,
	updatePointer,
	loadNodes,
	loadTabs,
	removeNode,
	removeTab,
	reloadNode,
	reloadTab,
	loadTab} from './helper';
import {
	LoadFetched as LoadFetchedTabs,
	LoadTab,
	RegisterDroppable,
	ReloadTab,
	RemoveTab,
	SetLastClicked,
	SubstitutePointer,
	SubstituteTab,
	UpdatePointer } from '../actions/tab.actions';
import { RegisterListener, UnRegisterListener, UpdateCurrentUrl } from '../actions/listener.actions';
import { SetApplicationNodeID } from '../actions/application.actions';
import * as _ from 'lodash';
import { ListenerHash, Node, Tab, User, Ancestry, ChangeWrapper, Command } from 'src/app/models';
import { LoadUserObj } from '../actions/auth.actions';

export const featureKey = 'graph';

export interface GraphState {
    appNodeID 		: string;
    nodes 			: { [key: string]: Node[] };
	tabs 			: { [key: string]: Tab[] };
	user 			: User;
	listeners   	: ListenerHash;
	url	 			: string;
	click			: Ancestry;
	drop			: string[];
	lastAction		: string;
}

export const initialState: GraphState = {
    appNodeID 		: null,
    nodes 			: {},
	tabs			: {},
	user 			: new User( "GUEST" ),
	listeners   	: {},
	url 			: '',
	click			: null,
	drop			: [],
	lastAction		: null
};

const graphReducer = createReducer(
	initialState,

	on(SetApplicationNodeID, 	(state, { payload }) 	=> ({ ...state, appNodeID: payload, lastAction: "SetApplicationNodeID" })),
	on(SubstituteAppNode, 		(state 			   ) 	=> ({ ...state, appNodeID: comandeerNodeId( state.appNodeID ),
																	 	nodes: comandeerNode( state.nodes, state.appNodeID), lastAction: "SubstituteAppNode" })),

    on(LoadNode,           		(state, { payload }) 	=> ({ ...state, nodes: 	{ ...state.nodes, [ payload.id ] : [ payload.node ] }, lastAction: "LoadNode" })),
    on(ReloadNode,          	(state, { payload }) 	=> ({ ...state, nodes: 	reloadNode( state.nodes, payload ),  lastAction: "ReloadNode"  })),
    on(LoadFetchedNodes,    	(state, { payload }) 	=> ({ ...state, nodes: 	loadNodes( state.nodes, payload ),  lastAction: "LoadFetchedNodes"  } )),
    on(SubstituteNode, 			(state, { payload }) 	=> ({ ...state, nodes: 	comandeerNode( state.nodes, payload), lastAction: "SubstituteNode"})),
    on(UpdateNode, 				(state, { payload }) 	=> ({ ...state, nodes: 	updateNode( state.nodes, payload), lastAction: "UpdateNode" })),
	on(RemoveNode,     			(state, { payload }) 	=> ({ ...state, nodes: 	removeNode( state.nodes, payload), lastAction: "RemoveNode" })),

    on(LoadTab,           		(state, { payload }) 	=> ({ ...state, tabs: 	loadTab( state.tabs, payload.id, payload.tab, payload.origin), lastAction: "LoadTab" })), // { ...state.tabs, [ payload.id ] : [ payload.tab ] } })),
    on(ReloadTab,          		(state, { payload }) 	=> ({ ...state, tabs: 	reloadTab( state.tabs, typeof payload === 'string' ? payload : payload.id, typeof payload === 'string' ? 'server' : payload.origin), lastAction:"ReloadTab" })),
    on(LoadFetchedTabs,     	(state, { payload }) 	=> ({ ...state, tabs:  	loadTabs( state.tabs, payload ), lastAction:"LoadFetchedTabs" })),
	on(RemoveTab,     			(state, { payload }) 	=> ({ ...state, tabs:  	removeTab( state.tabs, payload ), lastAction:"RemoveTab" })),
	on(UpdatePointer,			(state, { payload }) 	=> ({ ...state, tabs:  	updatePointer(	state.tabs, payload), lastAction:"UpdatePointer"})),
	on(SubstituteTab, 			(state, { payload }) 	=> ({ ...state, tabs:  	replaceTab(state.tabs, { oldTabId: payload.oldTabId, newTabObj: state.tabs[payload.newTabId][0] }), lastAction:"SubstituteTab" })),
    on(RegisterDroppable, 		(state, { payload }) 	=> ({ ...state, drop:  	payload.state ? [ ...state.drop, payload.tabid ] : state.drop.filter(tabid => tabid != payload.tabid), lastAction:"RegisterDroppable" })),
	on(SetLastClicked,			(state, { payload }) 	=> ({ ...state, tabs:  	updatePointer(	state.tabs, { ancestry: payload, changes: { loading: true } }),
																		click: 	payload, lastAction:"SetLastClicked" })),
	on(SubstitutePointer, 		(state, { payload }) 	=> ({ ...state, tabs:  	replacePointer(	state.tabs, payload),
																	 	nodes: 	comandeerNode(	state.nodes, payload.pointer._id), lastAction:"SubstitutePointer"})),

	on(RegisterListener, 		(state, { payload }) 	=> ({ ...state, listeners: AddToListenerHash(state.listeners, payload.ancestry, payload.origin), lastAction:"RegisterListener" })),
	on(UnRegisterListener, 		(state, { payload }) 	=> ({ ...state, listeners: removeFromListener(state.listeners, payload.pointer, payload.origin), lastAction:"UnRegisterListener" })),
	on(UpdateCurrentUrl, 		(state, { payload }) 	=> ({ ...state, url: payload, lastAction:"UpdateCurrentUrl" })),

    on(LoadUserObj,				(state, { payload } ) 	=> ({ ...state, user: payload }))
);
export function reducer(state: GraphState | undefined, action: Action) {
  	return graphReducer(state, action);
}
