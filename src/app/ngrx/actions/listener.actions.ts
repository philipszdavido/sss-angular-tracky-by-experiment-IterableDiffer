import { createAction, props } from '@ngrx/store';
import { Ancestry } from 'src/app/models';
import { Pointer } from 'src/app/models/pointer';

export const RegisterListener		= createAction( '[ACTION Listener] Register Listener', 		props<{ payload: { ancestry: Ancestry, origin: string }   }>() );
export const UnRegisterListener		= createAction( '[ACTION Listener] UnRegister Listener', 	props<{ payload: { pointer: Pointer, origin: string }    }>() );
export const UpdateCurrentUrl 		= createAction( '[ACTION Router]   Update CurrentUrl', 		props<{ payload: string     }>() );
