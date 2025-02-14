import { createAction, props } from '@ngrx/store';
import { Pointer, Ancestry, Tab } from 'src/app/models';

export const LoadTabObject  	  = createAction( '[ACTION Tabs] Load Object',			props<{ payload: { tabid : string, tabobj : Tab } }>() );
export const LoadFetched    	  = createAction( '[ACTION Tabs] Load Fetched',			props<{ payload: { [id: string] : Tab[] } }>() );
export const LoadTab        	  = createAction( '[ACTION Tabs] Load Tab',				props<{ payload: { id: string, tab: Tab, origin: string } }>() );
export const ReloadTab 			  = createAction( '[ACTION Tabs] Reload Tab',			props<{ payload: string | { id: string, origin: string } }>());
export const RemoveTab			  = createAction( '[ACTION Tabs] Remove Tab',			props<{ payload: string }>() );
export const SubstitutePointer	  = createAction( '[ACTION Tabs] Substitute Pointer',	props<{ payload: { id: string, pointer: Pointer; comandeer: boolean, origin: string  } }>() );
export const UpdatePointer	  	  = createAction( '[ACTION Tabs] Update Pointer',		props<{ payload: { ancestry: Ancestry; changes: Pointer; } }>() );
export const SubstituteTab 		  = createAction( '[ACTION Tabs] Substitute Tab',		props<{ payload: { oldTabId: string; newTabId: string; } }>() );
export const SetLastClicked		  = createAction( '[ACTION Tabs] Set Last Clicked',		props<{ payload: Ancestry }>() );
export const RegisterDroppable	  = createAction( '[ACTION Tabs] Register Droppable',	props<{ payload: { tabid: string; state: boolean; } }>() );
export const ComandeerOtherDays   = createAction( '[ACTION Tabs] Comandeer Other Days',	props<{ payload: string }>() );
