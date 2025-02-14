import { createAction, props } from "@ngrx/store";
import { Authentication, Registration, User } from "src/app/models";

export const Login			= createAction( '[ACTION Auth] Login',		props<{ payload: Authentication }>());
export const Logout			= createAction( '[ACTION Auth] Logout' );
export const Register		= createAction( '[ACTION Auth] Register',	props<{ payload: Registration }>());
export const LoadUserObj	= createAction( '[ACTION Auth] Load User',	props<{ payload: User }>() );
