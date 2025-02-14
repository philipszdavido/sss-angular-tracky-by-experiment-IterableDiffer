import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { InsertData, MoveData, Pointer, DeleteData, Tab, UpdateData } from '../../models';
import { Action } from '@ngrx/store';
import { channelUrl } from 'src/app/helpers/urls';
import { InjectData } from 'src/app/models/injectData';
import { SSSMutateService } from './sss-mutate.interface';
import { Trickle } from 'src/app/models/trickle';
import { SSSDomService } from '../sss-dom-service';

@Injectable({
  providedIn: 'root'
})
export class SSSMutateAuthService implements SSSMutateService {

	private http 			= inject(HttpClient)
	private sssDomService 	= inject(SSSDomService);

	triggerInject(child_pointer: Pointer, idx: number, revision: number): Observable<{ actions: Action[] }> {

		const payload = new InjectData(child_pointer, idx); 
		
		const sisters = this.sssDomService.fetchSistersFromDOM( "tab._id" ).filter(element => element !== null);

		return this.http.post<{ actions: Action[] }>( `${channelUrl}/INJECT`, { revision, payload, sisters } );
	}

	triggerInsert(name: string, revision: number, tab: Tab): Observable<{ actions: Action[] }> {

		const payload = new InsertData(name, name.replace(/\s+/g, '-').toLowerCase(), 0);
		
		const sisters = this.sssDomService.fetchSistersFromDOM( tab._id ).filter(element => element !== null);

		return this.http.post<{ actions: any[] }>( `${channelUrl}/INSERT`, { revision, payload, sisters } )
			.pipe(
				switchMap(({ actions }) => {

					return of({ actions: true ? actions.slice(0, -1) : actions });
				})
			);
	}

	triggerDelete(child_pointer: Pointer, idx: number, revision: number, tab: Tab): Observable<{ actions: Action[] }> {

		const payload = new DeleteData(child_pointer, idx);

		const sisters = this.sssDomService.fetchSistersFromDOM( tab._id ).filter(element => element !== null);

		return this.http.post<{ actions: Action[] }>( `${channelUrl}/DELETE`, { revision, payload, sisters } );
	}

	triggerMove(from: number, to: number, revision: number, pointer: Pointer, from_tabid: string, to_tabid ?: string): Observable<{ actions: Action[] }> {

		const payload = new MoveData(from, to, pointer);

		const sisters = this.sssDomService.fetchSistersFromDOM(from_tabid);
	  
		const postData: { revision: number; payload: MoveData; sisters: Trickle[][], sisters_to?: Trickle[][] } = { revision, payload, sisters };
	  
		if ( to_tabid ) { postData.sisters_to = this.sssDomService.fetchSistersFromDOM(to_tabid).filter(element => element !== null); }
	  
		return this.http.post<{ actions: Action[] }>(`${channelUrl}/MOVE`, postData);
	}

	triggerUpdate( changes: Partial<Pointer>, tab: Tab, pointerIndex: number ): Observable<{ actions: Action[] }> {

		const payload = new UpdateData(changes, pointerIndex);

		const sisters = this.sssDomService.fetchSistersFromDOM( tab._id ).filter(element => element !== null);
		
		return this.http.post<{ actions: Action[] }>( `${channelUrl}/UPDATE_POINTER`, { payload, sisters } );
	}
}
