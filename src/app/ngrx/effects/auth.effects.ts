import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { Actions, ofType, createEffect} from '@ngrx/effects';
import { isPlatformBrowser, Location } from '@angular/common';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Action, Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { PushActions } from '../actions/beacon.actions';
import { SSSWebsocketService } from 'src/app/services/sss-websocket.service';
import { SSSApiService } from 'src/app/services/sss-api.service';
import { Login, Logout, Register } from '../actions/auth.actions';
import { SSSTokenService } from 'src/app/services/sss-token.service';

@Injectable()
export class AuthEffects {

    private sssTokenService = inject(SSSTokenService);
    private sssApiService = inject(SSSApiService);
    private location = inject(Location);
    private sssWsService = inject(SSSWebsocketService);
    private platformId = inject(PLATFORM_ID);
    private actions$ = inject(Actions);
    private store = inject(Store<AppState>);

    errorHandler(error: any) { return throwError(error || "server error."); }

    Register$ = createEffect(() =>
        this.actions$.pipe(
            ofType(Register),
            filter(action => isPlatformBrowser(this.platformId)),
            switchMap(action => this.sssApiService.register(action.payload)),
            tap((data: { actions: Action[] })   => this.store.dispatch( PushActions( { payload: data.actions[0] } ) ) ),
            tap((data: { actions: Action[] })   => this.sssTokenService.loadToken( (data.actions[1] as any).payload.token ) ),
            //tap((data: { actions: Action[] })   => this.sssWsService.connect() ),
            map((data: { actions: Action[] }) => {

				this.location.go('/');

                const [,...rest] = data.actions;

				return this.store.dispatch( PushActions( { payload: rest } ) );
			}),
            catchError(this.errorHandler)
        ),
        {dispatch : false}
    );


    Login$ = createEffect(() =>
        this.actions$.pipe(
            ofType(Login),
            filter(action => isPlatformBrowser(this.platformId)),
			map(action => action.payload),
            switchMap(({ username, password })  => this.sssApiService.login( this.location.path().split('/'), {}, username, password ) ),
            tap((data: { actions: Action[] })   => this.store.dispatch( PushActions( { payload: data.actions[0] } ) ) ),
            tap((data: { actions: Action[] })   => this.sssTokenService.loadToken( (data.actions[1] as any).payload.token ) ),
            //tap((data: { actions: Action[] })   => this.sssWsService.connect() ),
            map((data: { actions: Action[] })   => {

				this.location.go('/');

                const [,...rest] = data.actions;

				return this.store.dispatch( PushActions( { payload: rest } ) );
            }),
            catchError(this.errorHandler)
        ),
        {dispatch : false}
    );

    Logout$ = createEffect(() =>
		this.actions$.pipe(
			ofType(Logout),
			filter(action => isPlatformBrowser(this.platformId)),
			switchMap(action => this.sssApiService.logout()),
			map(batch => {

                this.sssTokenService.removeToken();

				this.location.go('/');

				this.store.dispatch(PushActions( { payload: batch.actions } ) );
			})
		),
		{ dispatch: false }
	);
 }
