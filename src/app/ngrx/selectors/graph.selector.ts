import { AppState } from '../reducers';
import { createSelector } from '@ngrx/store';

export const selectGraphState = (state: AppState) => state.graph;
export const getNodes = createSelector(
    selectGraphState,
    store => store.nodes
);
export const getTabs = createSelector(
    selectGraphState,
    store => store.tabs
);
export const getListeners = createSelector(
    selectGraphState,
    store => store.listeners
);
export const getUrl = createSelector(
    selectGraphState,
    store => store.url
);
export const getLastClicked = createSelector(
    selectGraphState,
    store => store.click
);
export const getNodeById = (props) => createSelector(
	getNodes,
	(nodeList) => {
		return (nodeList[props.id] && nodeList[props.id][0]) || (props.id && JSON.parse(localStorage.getItem(props.id)));
	}
);
export const getTabById = (props) => createSelector(
	getTabs,
	(tabList) => {
		return (tabList[props.id] && tabList[props.id][0]) || (props.id && JSON.parse(localStorage.getItem(props.id)));
	}
);
export const getAppNodeId =  createSelector(
	selectGraphState,
    store => store.appNodeID
);
export const getDroppableList =  createSelector(
	selectGraphState,
    store => store.drop
);
export const selectLastAction = createSelector(
    selectGraphState,
    store => store.lastAction
);