import { AppState } from '../reducers';
import { createSelector } from '@ngrx/store';

export const selectChangeState = (state: AppState) => state.changes;

export const getTabChanges =  createSelector(
	selectChangeState,
    store => store.tabs
);
export const getNodeChanges =  createSelector(
	selectChangeState,
    store => store.nodes
);
export const getTempChanges =  createSelector(
	selectChangeState,
    store => store.temp
);
export const getChangeByTabId =  (props) => createSelector(
	getTabChanges,
	(changeHash) => {
		return changeHash[props.id];
	}
);
export const getChangeByNodeId = (props) => createSelector(
	getNodeChanges,
	(ChangeNodeHash) => {
		return ChangeNodeHash[props.id];
	}
);
export const getTempChangeByTabId = (props) => createSelector(
	getTempChanges,
	(ChangeNodeHash) => {
		return ChangeNodeHash[props.id];
	}
);
