import { AppState } from '../reducers';
import { createSelector } from '@ngrx/store';

export const selectGraphState = (state: AppState) => state.graph;

export const getLoggedInStatus = createSelector(
    selectGraphState,
    store => store.user._id == "GUEST"
);
export const getUser = createSelector(
    selectGraphState,
    store => store.user
);
