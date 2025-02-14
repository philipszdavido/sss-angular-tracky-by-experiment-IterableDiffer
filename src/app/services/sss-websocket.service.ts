import { inject, Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';
import { Observable, timer, Subject, EMPTY } from 'rxjs';
import { retryWhen, tap, delayWhen, switchAll, catchError } from 'rxjs/operators';
import { Pointer } from '../models';
import { HttpClient } from '@angular/common/http';
import { channelUrl } from '../helpers/urls';
import { AppState } from '../ngrx/reducers';
import { Store, Action } from '@ngrx/store';
import { PushActions } from '../ngrx/actions/beacon.actions';
import { SSSAccountService } from './sss-account.service';

export const WS_ENDPOINT = environment.wsEndpoint;
export const RECONNECT_INTERVAL = environment.reconnectInterval;


@Injectable({
  providedIn: 'root'
})
export class SSSWebsocketService {

	private socket$: WebSocketSubject<any> | null = null;
	private messagesSubject$ = new Subject();
	private messages$ = this.messagesSubject$.pipe(switchAll(), catchError(e => { throw e }));

	private http = inject(HttpClient);
	private store = inject(Store<AppState>);
	private sssAccountService = inject(SSSAccountService);
	
	constructor() {

		this.messages$.pipe(
			catchError(error => { throw error }),
			tap({
				error: error => console.log('[Live Table component] Error:', error),
				complete: () => console.log('[Live Table component] Connection Closed')
			})
		).subscribe((batch: any) => {
			console.log("WEBSOCKET Message Received", batch);
			this.store.dispatch(PushActions( { payload: batch.actions } ) );
		});
	}

	async connect(cfg: { reconnect: boolean } = { reconnect: false }): Promise<void> {

		if(!this.socket$ || this.socket$.closed) {

			this.socket$ = this.getNewWebSocket();

			const messages = this.socket$.pipe(
				cfg.reconnect ? this.reconnect : o => o,
				tap({ error: error => console.log(error), }),
				catchError(_ => EMPTY)
			)

			this.messagesSubject$.next(messages);
		}
	}

	subscribeToSocket(parent_pointer: Pointer, pagination_index: number): void {

		if( this.sssAccountService.determineIfLoggedIn() ) {
			this.http.post<string>(`${channelUrl}/SUBSCRIBE`, { parent_pointer, pagination_index }).subscribe();
		}
	}

	unSubscribeToSocket(parent_pointer: Pointer, pagination_index: number): void {
		
		if( this.sssAccountService.determineIfLoggedIn() ) {
			this.http.post(`${channelUrl}/SUBSCRIBE`, { parent_pointer, pagination_index }).subscribe();
		}
	}

	// https://golb.hplar.ch/2020/04/rxjs-websocket.html
	// https://javascript-conference.com/blog/real-time-in-angular-a-journey-into-websocket-and-rxjs/
	// https://github.com/ralscha/blog2020/tree/master/rxjs-websocket

	private reconnect(observable: Observable<any>): Observable<any> {

		return observable.pipe(retryWhen(errors => errors.pipe(
			tap(val => console.log('[Data Service] Try to reconnect', val)),
			delayWhen(_ => timer(RECONNECT_INTERVAL))))
		);
	}

	private getNewWebSocket() {
		return webSocket({
			url: WS_ENDPOINT,
			openObserver: {
				next: () => console.log('[DataService]: connection ok')
			},
			closeObserver: {
				next: () => {
					console.log('[DataService]: connection closed');
					this.socket$ = undefined;
					this.connect({ reconnect: true });
				}
			}
		});
	}

	close(): void {
		this.socket$.complete();
		this.socket$ = undefined;
	}
}
