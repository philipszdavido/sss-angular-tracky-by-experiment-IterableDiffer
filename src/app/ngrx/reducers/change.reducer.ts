import { Action, createReducer, on } from '@ngrx/store';
import {
	LoadChanges,
	CutTabFromChanges,
	SwapChanges,
	LoadNodeChanges,
	CutNodeFromChanges
} from '../actions/change.actions';
import * as _ from "lodash";
import * as merge from 'deepmerge';
import { ChangeWrapper, Command } from 'src/app/models';

export const featureKey = 'changes';

export interface ChangeState {
    tabs 	: { [id:string]: ChangeWrapper },
	nodes	: { [id:string]: Command },
    temp	: { [id:string]: Command }
}
export const initialState: ChangeState = {
    tabs	: {},
	nodes	: {},
	temp	: {}
};
const changeReducer = createReducer(
	initialState,

	on(LoadChanges, 		(state, { payload }) 	=> ({ ...state, tabs: merge.all( [ state.tabs, payload ] )  as { [id:string]: ChangeWrapper } })),
	on(CutTabFromChanges, 	(state, { payload }) 	=> ({ ...state, tabs: _.omit( state.tabs, payload.tabid )})),
	on(SwapChanges, 		(state, { payload }) 	=> ({ ...state, tabs: {..._.omit( state.tabs, payload.cutid ), ...payload.newList } as { [id:string]: ChangeWrapper } })),

	on(LoadNodeChanges, 	(state, { payload }) 	=> ({ ...state, nodes: merge.all( [ state.nodes, payload ] ) as { [id:string]: Command } })),
	on(CutNodeFromChanges, 	(state, { payload }) 	=> ({ ...state, nodes: _.omit( state.nodes, payload.nodeid )}))
);
export function reducer(state: ChangeState | undefined, action: Action) {
  	return changeReducer(state, action);
}
