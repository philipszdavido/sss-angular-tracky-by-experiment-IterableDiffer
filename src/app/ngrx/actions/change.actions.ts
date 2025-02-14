import { createAction, props } from '@ngrx/store';
import { ChangeWrapper, Command } from 'src/app/models';

export const CutTabFromChanges 		= createAction( '[ACTION Changes] CutTabFromChanges', 		props<{ payload: { tabid: string; } }>() );
export const LoadChanges 		    = createAction( '[ACTION Changes] LoadChanges', 			props<{ payload: { [id: string]: ChangeWrapper } }>() );
export const SwapChanges 			= createAction( '[ACTION Changes] SwapChanges', 			props<{ payload: { cutid: string, newList: { [id: string]: ChangeWrapper } } }>() );
export const CutNodeFromChanges 	= createAction( '[ACTION Changes] CutNodeFromChanges', 		props<{ payload: { nodeid: string; } }>() );
export const LoadNodeChanges 		= createAction( '[ACTION Changes] LoadNodeChanges', 		props<{ payload: { [ id: string ]: Command } }>() );