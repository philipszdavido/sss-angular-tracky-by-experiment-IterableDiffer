import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { AppState } from './ngrx/reducers';
import { map } from 'rxjs/operators';
import { SubstituteAppNode } from './ngrx/actions/application.actions';
import { getAppNodeId } from './ngrx/selectors/graph.selector';
import { Ancestry } from './models/ancestry';
import { SSSAccountService } from './services/sss-account.service';

@Component({
	selector: 'app-root',
	template: `
		<sss-node
			*appCustomFor="let ancestry of ancestryList$ | async; trackBy: identify;"
			[ngClass]="ancestry.pointer._id"
			[ancestry]="ancestry"
			[bubbleUp]="handleBubble.bind(this)" />

		<app-dev-footer></app-dev-footer>
	`,
	styles: [``]
})

export class AppComponent implements OnInit {

	ancestryList$ 	: Observable<Ancestry[]>;
	
	private sssAccountService = inject(SSSAccountService);
	private store = inject(Store<AppState>);

	ngOnInit() {

		this.ancestryList$ = this.store.pipe(
			select(getAppNodeId),
			map(appId => !appId ? [] : [ new Ancestry({

				_id							: appId,
				instance					: "master",
				isFavorite					: false,
				currentdate					: null,
				currenttab					: "all",
				urlnodelistener				: null,
				defaultchildrenstate		: "card",
				pagination					: [ { serial : "primero" } ],
				id 							: this.sssAccountService.getUser()._id
			}, null, null) ])
		);
	}

	identify(index, ancestry: Ancestry) { return `${ancestry.pointer.id}`; }

	handleBubble(child: Ancestry) { return [ SubstituteAppNode() ]; }
}
