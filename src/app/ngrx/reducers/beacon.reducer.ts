import { Action, createReducer, on } from '@ngrx/store';
import { dqNextAction, UnshiftActions, PushActions } from '../actions/beacon.actions';
import { deQueue, isEmptyArray, pushGuardBuffer } from './helper';

export const featureKey = 'beacon';

export interface BeaconState {
    queue   : (any /* Action */ | Action[])[];
	guard   : (any /* Action */ | Action[])[];
}
export const initialState: BeaconState = {
    queue   : [],
	guard   : []
};
const beaconReducer = createReducer(
	initialState,

    on(dqNextAction, 	(state) 				=> ({ ...state, guard: pushGuardBuffer(state.guard, state.queue), queue: deQueue(state.queue) })),
    on(UnshiftActions, 	(state, { payload }) 	=> ({ ...state, queue: isEmptyArray(payload) ? state.queue : [...state.queue.slice(0,1), payload, ...state.queue.slice(1)] })),
    on(PushActions, 	(state, { payload }) 	=> ({ ...state, queue: isEmptyArray(payload) ? state.queue : [ ...state.queue, payload ] }))
 );
export function reducer(state: BeaconState | undefined, action: Action) {
  	return beaconReducer(state, action);
}
