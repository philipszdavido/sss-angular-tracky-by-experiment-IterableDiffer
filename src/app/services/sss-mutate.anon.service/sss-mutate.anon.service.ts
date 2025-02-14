import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DeleteData, MoveData, Pointer, Tab } from '../../models';
import { Store } from '@ngrx/store';
import { AppState } from '../../ngrx/reducers';
import { SSSTabService } from '../sss-tab.service';
import { SSSMutateService } from 'src/app/services/sss-mutate.anon.service/sss-mutate.interface';
import { InjectData } from 'src/app/models/injectData';
import { Ancestry } from 'src/app/models/ancestry';
import { UpdatePointer } from 'src/app/ngrx/actions/tab.actions';
import { PushActions } from 'src/app/ngrx/actions/beacon.actions';


@Injectable({
  providedIn: 'root'
})
export class SSSMutateAnonService implements SSSMutateService {

	private store = inject(Store<AppState>)
	private sssTabService = inject(SSSTabService)

	triggerInsert(insertName: string, id: string): Observable<any> { return of(); }

	triggerInject(tab: Tab, { idx, pointer }: InjectData, { defaultchildrenstate }: Pointer ): Tab {

		const currenttab 			= "basic"; // defaultchildrenstate == "card" ? "all" : defaultchildrenstate || "basic";
		const instance 				= Math.floor(Math.random() * 10000000000000000).toString(16);

		return { ...tab, inventory 	: [...tab.inventory.slice(0, idx), { ...pointer, currenttab, instance  }, ...tab.inventory.slice(idx)],
						 _id 		: this.sssTabService.comandeerId( tab._id ) };
	}

	triggerDelete(tab: Tab, { pointer, index }: DeleteData): Tab {

		if( !this.sssTabService.validatePointerAtIndex( tab, pointer, index ) ) {
			throw "Pointer at delete command index does not match actual pointer at inventory index";
		}

		return { ...tab, inventory 	: [...tab.inventory.slice(0, index), ...tab.inventory.slice(index + 1)],
						 _id 		: this.sssTabService.comandeerId( tab._id ) };
	 }

	triggerMove(tab: Tab, { from, to }: MoveData ): Tab {

		const pointer = tab.inventory[from];

		tab.inventory.splice(from, 1);

		tab.inventory.splice(to, 0, pointer);

		return { ...tab, _id: this.sssTabService.comandeerId( tab._id ) };
	}

	triggerUpdate( ancestry: Ancestry, changes: Pointer ): void {

		const transaction = UpdatePointer( { payload: { ancestry, changes } } );

		this.store.dispatch( PushActions( { payload: transaction } ) );
	}
}
